// Create connection to Node.JS Server
const socket = io();

let devices = [];

let capture;
let constraints;
let tracker;
let positions;
let w = 0, h = 0;

let isDebugging = true;
let isLooking = false; //current looking status
let isLookingPrev = false; //previous looking status

let isCurLooking = false;
let isCurLookingPrev = false;
let lookingThreshold = 5;
let lookingTimes = 0;

// chrome
// const webcamId = "a9b772bf338035fc72e8924d0fa2aefb13c52744e7c00d743532bab5a98c2b0a";
// const webcamId = "4a9871ca9f4961e0a35cbda0217497cfe5c31a160aedea44d89969ffb1bd05cc";

let curWordIndex = 0;
let wordIndex;
let wordSize = 120;
// const words = [
//     "A dreaded sunny day",
//     "So I meet you at the cemetry gates",
//     "Keats and Yeats are on your side",
//     "While Wilde is on mine",
//     "So we go inside and we gravely read the stones",
//     "All those people, all those lives",
//     "Where are they now?",
//     "With loves, and hates",
//     "And passions just like mine",
//     "They were born",
//     "And then they lived",
//     "And then they died",
//     "It seems so unfair",
//     "I want to cry",
//     "You say : 'Ere thrice the sun done salutation to the dawn'",
//     "And you claim these words as your own",
//     "But I've read well, and I've heard them said",
// ]

const words = [
    "00000000000000000000000000000000000000000",
    "11111111111111111111111111",
    "22222222222222222222222222",
    "33333333333333333333333333",
    "44444444444444444444444444",
    "55555555555555555555555555",
    "66666666666666666666666666",
    "77777777777777777777777777",
    "88888888888888888888888888",
    "99999999999999999999999999"
]

let letters = [];


function preload() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(() => {
        //once permission has been allowed then we can select which device to use
        navigator.mediaDevices.enumerateDevices()
            .then(gotSources);
    });
}

function setup() {
    w = windowWidth;
    h = windowHeight;



    frameRate(10);
    colorMode(HSB);
    
    textSize(wordSize);
    fill(0);

    if (letters.length == 0) {
        updateLetters(words[curWordIndex], wordSize);

    }
}

function draw() {
    background(255);
    // Flip the canvas so that we get a mirror image
    // translate(w, 0);
    // scale(-1.0, 1.0);
    // Uncomment the line below to see the webcam image (and no trail)
    //image(capture, 0, 0, w, h);
    if (tracker) {
        positions = tracker.getCurrentPosition();
    }



    if (isLooking && isCurLooking) {
        shakeText();
    } else {
        drawText();
    }

    // console.log("isLookingPrev:" + isLookingPrev + "  isLooking:" + isLooking)

    if (!isLookingPrev && isLooking) {
        if (curWordIndex < words.length - 2 || wordIndex == 0) {
            curWordIndex = wordIndex + 1;
        } else {
            curWordIndex = 0;
        }
        drawText();
    }




    // console.log(positions)
    // console.log("isLookingPrev:" + isLookingPrev)
    // console.log("isLooking:" + isLooking)

    isCurLookingPrev = isCurLooking;
    isCurLooking = positions ? true : false;

    if (isCurLookingPrev != isCurLooking) {
        lookingTimes = 0;
    } else {
        lookingTimes++;
        if (lookingTimes >= lookingThreshold) {
            socket.emit("is_1_looking", {
                isLooking: isCurLooking,
                wordIndex: curWordIndex
            });
        }
    }
    // console.log(lookingTimes + "isCurLooking:" + isCurLooking + "curWordIndex:" + curWordIndex)





    // if (positions) {
    //     socket.emit("is_1_looking", {
    //         isLooking: true
    //     });
    // } else {
    //     socket.emit("is_1_looking", {
    //         isLooking: false
    //     });
    // }


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

function updateLetters(_word, _wordSize) {
    let x = 100;
    let y = h / 2;
    for (let i = 0; i < _word.length; i++) {
        letters[i] = new Letter(x, y, _word.charAt(i));
        if (x < w - textWidth(_word.charAt(i)) - 100) {
            x += textWidth(_word.charAt(i));
        } else {
            x = 100;
            y = h / 2 + _wordSize;
        }
    }
}

function drawText() {
    for (let i = 0; i < letters.length; i++) {
        letters[i].display();
        letters[i].home();
    }
}

function shakeText() {
    for (let i = 0; i < letters.length; i++) {
        letters[i].display();
        letters[i].shake();
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
        //for reeal

        if (sources[i].kind === 'video' || sources[i].kind === 'videoinput' && sources[i].label.includes("USB")) {
            console.log('video: ' + sources[i].label + ' ID: ' + sources[i].deviceId);
            devices.push(sources[i]);
        }

        //for testing
        // if (sources[i].kind === 'video' || sources[i].kind === 'videoinput') {
        //     console.log('video: ' + sources[i].label + ' ID: ' + sources[i].deviceId);
        //     devices.push(sources[i]);
        // }
    }

    constraints = {
        video: {
            deviceId: {
                exact: devices[0].deviceId
            },
            width: windowWidth,
            height: windowHeight,
        }
    };

    capture = createCapture(constraints);
    // capture = createCapture(VIDEO);
    createCanvas(w, h);
    capture.size(w, h);
    capture.hide();

    tracker = new clm.tracker();
    tracker.init();
    tracker.start(capture.elt);
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
    console.log("window-1-socket connect:" + socket.id);
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
    console.log("window-1-socket disconnect:" + socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("is_2_looking", (data) => {
    isLookingPrev = isLooking;
    isLooking = data.isLooking;
    wordIndex = data.wordIndex;
});