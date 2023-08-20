/**
 * Based on Processing Video Background Subtraction example
 * by Golan Levin.
 *
 * Detect the presence of people and objects in the frame using a simple
 * background-subtraction technique. To initialize the background, press a key.
 */

// Create connection to Node.JS Server
const socket = io();


// p5.js Video capture
let myCapture;
// OpenCV capture helper
let myCVCapture;
// (RGBA) Mat to store the latest color camera frame
let myMat;
// RGB mat
let myMatRGB;
// one frame of background
let myBackgroundMat;
// foreground - background difference Mat
let differenceMat;

let deviceList = [];
let capture1, capture2;
let constraints1, constraints2;
const captureWidrh = 320;
const captureHeight = 240;

let tracker1, tracker2;
let positions1, positions2;


function preload() {
    navigator.mediaDevices.enumerateDevices().then(gotSources);
}

function setup() {
    // canvas = createCanvas(width, height);
    // setup p5 capture
    myCapture = createCapture(VIDEO);
    myCapture.size(320, 240);
    myCapture.hide();

    // frameRate(10);
    colorMode(HSB);
    background(0);

    let constraints1 = {
        video: {
            deviceId: {
                exact: '5e37a0cf667d7d6235b17247206889f5e1b163c3ad7a7082fd71134462731c91'
            },
            width: windowWidth,
            height: windowHeight,
        }
    };

    let constraints2 = {
        video: {
            deviceId: {
                exact: '73b3602c02310b583eaf8a8077bd6c85d917634f13e0f83d1aafb0b24f732e5a'
            },
            width: windowWidth,
            height: windowHeight,
        }
    };

    // capture1 = createCapture(constraints1);
    // capture2 = createCapture(constraints2);

    // let capture = createCapture(VIDEO);
    createCanvas(windowWidth, windowHeight);
    // capture.size(windowWidth, windowHeight);
    // capture.hide();

    // tracker = new clm.tracker();
    // tracker.init();
    // tracker.start(capture.elt);

    // wait for OpenCV to init
    p5.cv.onComplete = onOpenCVComplete;
}

function onOpenCVComplete() {
    // create a CV capture helper
    myCVCapture = p5.cv.getCvVideoCapture(myCapture);
    // create a CV Mat to read new color frames into
    myMat = p5.cv.getRGBAMat(320, 240);
    myMatRGB = p5.cv.getRGBMat(320, 240);
    // init background pixels
    myBackgroundMat = p5.cv.getRGBMat(320, 240);
    // init diff. pixels
    differenceMat = p5.cv.getRGBMat(320, 240);
}

function draw() {
    if (p5.cv.isReady) {
        // Difference between the current frame and the stored background
        let presenceSum = 0;
        // read from CV Capture into myMat
        myCVCapture.read(myMat);
        // convert to from RGBA to RGB
        p5.cv.convertColor(myMat, myMatRGB, cv.COLOR_RGBA2RGB);
        // Compute the absolute difference of the red, green, and blue channels
        // subtract myBackgroundMat from myMat and store result
        cv.absdiff(myMatRGB, myBackgroundMat, differenceMat);
        // display difference Mat
        p5.cv.drawMat(differenceMat, 0, 0);
        // Add these differences to the running tally
        presenceSum = p5.cv.sumData(differenceMat.data);
        // Print out the total amount of movement
        console.log(presenceSum / (differenceMat.total() * 255 * 3));
        // console.log('test');
    }

    // Flip the canvas so that we get a mirror image
    // translate(windowWidth, 0);
    // scale(-1.0, 1.0);
    // Uncomment the line below to see the webcam image (and no trail)
    //image(capture, 0, 0, w, h);

    //tracker
    // positions = tracker.getCurrentPosition();
    // console.log(positions)

    // if (positions.length > 0) {

    //     // Eye points from clmtrackr:
    //     // https://www.auduno.com/clmtrackr/docs/reference.html
    //     const eye1 = {
    //         outline: [23, 63, 24, 64, 25, 65, 26, 66].map(getPoint),
    //         center: getPoint(27),
    //         top: getPoint(24),
    //         bottom: getPoint(26)
    //     };
    //     const eye2 = {
    //         outline: [28, 67, 29, 68, 30, 69, 31, 70].map(getPoint),
    //         center: getPoint(32),
    //         top: getPoint(29),
    //         bottom: getPoint(31)
    //     }

    //     const irisColor = color(random(360), 80, 80, 0.4);
    //     drawEye(eye1, irisColor);
    //     drawEye(eye2, irisColor);
    // }
}

// When a key is pressed, capture the background image into the backgroundPixels
// buffer, by copying each of the current frame's pixels into it.
function keyPressed() {
    if (p5.cv.isReady) {
        p5.cv.copyRGB(myMatRGB, myBackgroundMat);
    }
}

// This method can be removed after the source ID has been determined.
function gotSources(sources) {
    for (var i = 0; i !== sources.length; ++i) {
        if (sources[i].kind === 'video' || sources[i].kind === 'videoinput') {
            console.log('video: ' + sources[i].label + ' ID: ' + sources[i].deviceId);
        }
    }
}

function getPoint(index) {
    return createVector(positions[index][0], positions[index][1]);
}


function drawEye(eye, irisColor) {
    noFill();
    stroke(255, 0.4);
    drawEyeOutline(eye);

    const irisRadius = min(eye.center.dist(eye.top), eye.center.dist(eye.bottom));
    const irisSize = irisRadius * 2;
    noStroke();
    fill(irisColor);
    ellipse(eye.center.x, eye.center.y, irisSize, irisSize);

    const pupilSize = irisSize / 3;
    fill(0, 0.6);
    ellipse(eye.center.x, eye.center.y, pupilSize, pupilSize);
}

function drawEyeOutline(eye) {
    beginShape();
    const firstPoint = eye.outline[0];
    eye.outline.forEach((p, i) => {
        curveVertex(p.x, p.y);
        if (i === 0) {
            // Duplicate the initial point (see curveVertex documentation)
            curveVertex(firstPoint.x, firstPoint.y);
        }
        if (i === eye.outline.length - 1) {
            // Close the curve and duplicate the closing point
            curveVertex(firstPoint.x, firstPoint.y);
            curveVertex(firstPoint.x, firstPoint.y);
        }
    });
    endShape();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0);
}

//Events we are listening for

// Connect to Node.JS Server
socket.on("connect", () => {
    console.log("window-1-socket connect:" + socket.id);
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
    console.log("window-1-socket disconnect:" + socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("drawing", (data) => {
    console.log(data);


});