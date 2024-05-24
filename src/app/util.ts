export class MovingAverage {
    private window: number;
    private values: number[];

    constructor(window: number) {
        this.window = window;
        this.values = [];
    }

    push(value: number) {
        this.values.push(value);

        if (this.values.length > this.window) {
            this.values.shift();
        }
    }

    average() {
        const sum = this.values.reduce((a, b) => a + b, 0);
        return sum / this.values.length;
    }
}


export const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);

    if (h > 99) {
        return "∞"
    }

    // format as HH:MM:SS
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}
