class Letter {

    constructor(x_, y_, letter_) {
        this.homex = this.x = x_;
        this.homey = this.y = y_;
        this.letter = letter_;
    }

    display() {
        // fill(0);
        textAlign(CENTER, CENTER);
        text(this.letter, this.x, this.y);
    }

    // Move the letter randomly
    shake() {
        this.x += random(-40, 40);
        this.y += random(-40, 40);
    }

    // Return the letter home
    home() {
        this.x = this.homex;
        this.y = this.homey;
    }
}
