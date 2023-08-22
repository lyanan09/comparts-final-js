/**
 * Based on Processing Video Background Subtraction example
 * by Golan Levin.
 *
 * Detect the presence of people and objects in the frame using a simple
 * background-subtraction technique. To initialize the background, press a key.
 */

// Create connection to Node.JS Server
const socket = io();


const captureWidrh = 320;
const captureHeight = 240;

let capture;
let constraints;
let tracker;
let positions;
let w = 0, h = 0;

let debug = true;
let isLooking = false;

// chrome
// const webcamId = "d4d49ce95bdb6a064c8d9e68bb747e2f7997eb7fa1c4957dbf14b87a7b447038";
const webcamId = "62b99945ee378fc03ebc3d05d4bbaeaa3be9f4cac22c77c20044e57d62416553";


function preload() {
    navigator.mediaDevices.enumerateDevices().then(gotSources);
}

function setup() {
    w = windowWidth;
    h = windowHeight;

    constraints = {
        video: {
            deviceId: {
                exact: webcamId
            },
            width: windowWidth,
            height: windowHeight,
        }
    };

    capture = createCapture(constraints);
    createCanvas(w, h);
    capture.size(w, h);
    capture.hide();

    frameRate(10);
    colorMode(HSB);
    background(0);

    tracker = new clm.tracker();
    tracker.init();
    tracker.start(capture.elt);
}

function draw() {
    // Flip the canvas so that we get a mirror image
    translate(w, 0);
    scale(-1.0, 1.0);
    // Uncomment the line below to see the webcam image (and no trail)
    //image(capture, 0, 0, w, h);
    positions = tracker.getCurrentPosition();

    // console.log(positions)

    if (positions) {
        socket.emit("is_1_looking", {
            isLooking: true
        });
    } else {
        socket.emit("is_1_looking", {
            isLooking: false
        });
    }


    // for debuging
    if (positions && debug) {

        // Eye points from clmtrackr:
        // https://www.auduno.com/clmtrackr/docs/reference.html
        const eye1 = {
            outline: [23, 63, 24, 64, 25, 65, 26, 66].map(getPoint),
            center: getPoint(27),
            top: getPoint(24),
            bottom: getPoint(26)
        };
        const eye2 = {
            outline: [28, 67, 29, 68, 30, 69, 31, 70].map(getPoint),
            center: getPoint(32),
            top: getPoint(29),
            bottom: getPoint(31)
        }

        const irisColor = color(random(360), 80, 80, 0.4);
        drawEye(eye1, irisColor);
        drawEye(eye2, irisColor);
    }
}

// When a key is pressed, capture the background image into the backgroundPixels
// buffer, by copying each of the current frame's pixels into it.
function keyPressed({ key }) {
    if (key == 'd')
        debug = !debug;
    else if (key == ' ')
        noLoop();
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
socket.on("is_2_looking", (data) => {
    console.log("window-2-socket looking status:" + data.isLooking);
    isLooking = data.isLooking;
});