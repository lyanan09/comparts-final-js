// Create connection to Node.JS Server
const socket = io();


const captureWidrh = 320;
const captureHeight = 240;

let capture;
let constraints;
let tracker;
let positions;
let w = 0, h = 0;

let isDebugging = true;
let isLooking = false; //current looking status
let isLookingPrev = false; //previous looking status

// chrome
const webcamId = "6f7155fa1011274bf2743b1c3bb32234b704c32093c79d3b1c14fd150741aeec";
// const webcamId = "62b99945ee378fc03ebc3d05d4bbaeaa3be9f4cac22c77c20044e57d62416553";

let curWordIndex = 0;
const words = [
    "A dreaded sunny day",
    "So I meet you at the cemetry gates",
    "Keats and Yeats are on your side",
    "While Wilde is on mine",
    "So we go inside and we gravely read the stones",
    "All those people, all those lives",
    "Where are they now?",
    "With loves, and hates",
    "And passions just like mine",
    "They were born",
    "And then they lived",
    "And then they died",
    "It seems so unfair",
    "I want to cry",
    "You say : 'Ere thrice the sun done salutation to the dawn'",
    "And you claim these words as your own",
    "But I've read well, and I've heard them said",
]

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
    background(255);

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

    // console.log("isLookingPrev:" + isLookingPrev)
    // console.log("isLooking:" + isLooking)

    if (positions) {
        socket.emit("is_2_looking", {
            isLooking: true
        });
    } else {
        socket.emit("is_2_looking", {
            isLooking: false
        });
    }



    // for debuging
    if (positions && isDebugging) {

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
    if (key == 'd') {
        isDebugging = !isDebugging;
        clear();
    }
    else if (key == ' ')
        noLoop();
    else if (key == 'f') {
        let fs = fullscreen();
        fullscreen(!fs);
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
    // drawEyeOutline(eye);

    const irisRadius = min(eye.center.dist(eye.top), eye.center.dist(eye.bottom));
    const irisSize = irisRadius * 2;
    noStroke();
    fill(irisColor);
    ellipse(eye.center.x, eye.center.y, irisSize, irisSize);

    const pupilSize = irisSize / 3;
    fill(0, 0.6);
    ellipse(eye.center.x, eye.center.y, pupilSize, pupilSize);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(255);
}

//Events we are listening for

// Connect to Node.JS Server
socket.on("connect", () => {
    console.log("window-2-socket connect:" + socket.id);
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
    console.log("window-2-socket disconnect:" + socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("is_1_looking", (data) => {
    // console.log("window-1-socket looking status:" + data.isLooking);
    isLookingPrev = isLooking;
    isLooking = data.isLooking;
});