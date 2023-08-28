class Letter {

    constructor(x_, y_, letter_) {
        this.homex = this.x = x_;
        this.homey = this.y = y_;
        this.letter = letter_;
    }

    display() {
        fill(0);
        textAlign(LEFT);
        text(letter, x, y);
    }

    // Move the letter randomly
    shake() {
        this.x += random(-4, 4);
        this.y += random(-4, 4);
    }

    // Return the letter home
    home() {
        this.x = this.homex;
        this.y = this.homey;
    }
}