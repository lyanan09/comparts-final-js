// Create connection to Node.JS Server
const socket = io();

let devices = []; // for 2 webcams

let capture;
let constraints; // capturen constraints
let tracker; // traker for face detection
let positions; // data of the face
let w = 0, h = 0; // canvas width and height

let isDebugging = false; // debugging mode

let isLooking = false; // current another page looking status
let isLookingPrev = false; // previous another page looking status
let isCurLooking = false; // current this page looking status
let isCurLookingPrev = false; // previous this page looking status

let lookingThreshold = 5;
let lookingTimes = 0; // the number of face detection from another page

let curWordIndex = 0; // word index of this page
let wordIndex; // word index of another page
let wordSize = 120;

let letters = []; // letters array for one word
let bgColor = 0; // background color of the whole page
let x = 200; // the positon x to draw the letters
let y = 0;  // the positon x to draw the letters

const words = [
    "Please stand in front of the white line",
    "Have a look around",
    "Hunted by pineapples",
    "Greasy as a waxed mannequin",
    "Try not to spit out the breakfast you never had",
    "Don't you think desserts are too sweet",
    "Put that into the missing dishwasher",
    "Really have nothing to say",
    "When can these nonsense be done",
    "Please stay a bit longer",
    "Make eye contact with random strangers",
    "Everything ends",
]

// const words = [
//     "0000000000000000000000000000000000000000000000000000",
//     "11111111111111111111111111",
//     "2222222222222222222222222222222222222222222222222222",
//     "33333333333333333333333333",
//     "44444444444444444444444444",
//     "55555555555555555555555555",
//     "66666666666666666666666666",
//     "77777777777777777777777777",
//     "88888888888888888888888888",
//     "99999999999999999999999999"
// ]

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
    y = h / 2;

    frameRate(10);
    colorMode(HSB);

    textSize(wordSize);
    updateLetters(words[curWordIndex], wordSize);
}

function draw() {
    background(bgColor);
    fill(abs(bgColor - 255));

    // when getting data from face detection
    if (tracker) {
        positions = tracker.getCurrentPosition();
    }

    if (isLooking && isCurLooking) {
        // when both screen is being watched
        shakeText();
    } else {
        drawText();
    }

    // when the other screen is being watched, change the word
    if (!isLookingPrev && isLooking && !isCurLooking) {
        if (curWordIndex < words.length - 2 || wordIndex == 0) {
            curWordIndex = wordIndex + 1;
            bgColor = abs(bgColor - 255);

        } else {
            curWordIndex = 0;
            bgColor = abs(bgColor - 255);

        }
        updateLetters(words[curWordIndex], wordSize);
    }

    // if(positions) {
    isCurLookingPrev = isCurLooking;
    isCurLooking = positions ? true : false;

    // becasue the "positions" is not stable 
    // for example: can't detect face when there are people looking at the screen at some moment
    // set a lookingThreshold to make sure that only when face being detected more than this number continously, means there are people looking at the screen
    if (isCurLookingPrev != isCurLooking) {
        lookingTimes = 0;
    } else {
        lookingTimes++;
        if (lookingTimes >= lookingThreshold) {
            //send to sever when this screen is being watched
            socket.emit("is_2_looking", {
                isLooking: isCurLooking,
                wordIndex: curWordIndex
            });
        }
    }

    // for debuging
    if (positions && isDebugging) {

        // Draw eyes:
        // Eye trails(random color) by kerryrodden
        // https://editor.p5js.org/kerryrodden/sketches/-KkpbDv6Z
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

// function for changing the word
function updateLetters(_word, _wordSize) {
    y = h / 2;
    x = 200;
    letters = [];

    for (let i = 0; i < _word.length; i++) {
        letters[i] = new Letter(x, y, _word.charAt(i));
        if (x < w - textWidth(_word.charAt(i)) - 200) {
            x += textWidth(_word.charAt(i));
        } else {
            x = 200;
            y = y + _wordSize;
        }
    }
}

// function for showing the words
function drawText() {
    for (let i = 0; i < letters.length; i++) {
        letters[i].display();
        letters[i].home();
    }
}

// function for shaking the words
function shakeText() {
    for (let i = 0; i < letters.length; i++) {
        letters[i].display();
        letters[i].shake();
    }
}

function keyPressed({ key }) {
    if (key == 'd') {
        // toggle debug mode
        isDebugging = !isDebugging;
    }
    else if (key == ' ') {
        // stop looping
        noLoop();
    }
    else if (key == 'f') {
        // toggle fullscreen
        let fs = fullscreen();
        fullscreen(!fs);
    }
    else if (key == 'r') {
        // refresh page
        location.reload();
    }
}

// callback function when webcam being found
function gotSources(sources) {

    for (var i = 0; i !== sources.length; ++i) {
        //for real

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
                exact: devices[1].deviceId
            },
            width: windowWidth,
            height: windowHeight,
        }
    };

    // setup capture and traker after webcam being found
    capture = createCapture(constraints);
    createCanvas(w, h);
    capture.size(w, h);
    capture.hide();

    tracker = new clm.tracker();
    tracker.init();
    tracker.start(capture.elt);
}

// Draw eyes:
// Eye trails(random color) by kerryrodden
// https://editor.p5js.org/kerryrodden/sketches/-KkpbDv6Z
function getPoint(index) {
    return createVector(positions[index][0], positions[index][1]);
}

// Draw eyes:
// Eye trails(random color) by kerryrodden
// https://editor.p5js.org/kerryrodden/sketches/-KkpbDv6Z
function drawEye(eye, irisColor) {
    noFill();
    stroke(255, 0.4);

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
    background(bgColor);
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
    isLookingPrev = isLooking;
    isLooking = data.isLooking;
    wordIndex = data.wordIndex;
});