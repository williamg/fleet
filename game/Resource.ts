/**
 * @file game/Resource.ts
 */

/**
 * A resource is a quantity like health or energy that has a maximum, minimum,
 * and current value. It can be expended or replenished.
 */
export class Resource {
    readonly min: number;
    readonly max: number;
    private _current: number;

    constructor(min: number, max: number, start: number) {
        console.assert(min <= start && start <= max);

        this.min = min;
        this.max = max;
        this._current = start;
    }

    get current() {
        return this._current;
    }

    increment(amount: number): void {
        this._current += amount;
        this._current = Math.min(this.max, Math.max(this.min, this._current));
    }

}
