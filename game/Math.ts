/**
 * @file game/Math.ts
 * Generic math functions and helpers
 */

/**
 * Basic 2D vector class
 */
export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    /**
     * Scale a vector
     * @param  {number} s Amount to scale by
     * @return {Vec2}     Result
     */
    scale(s: number): Vec2 {
        return new Vec2(s * this.x, s * this.y);
    }
    /**
     * Add a vector to this one
     * @param  {Vec2} v Vector to  add
     * @return {Vec2}   Result
     */
    add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    /**
     * Subtract a vector from this one
     * @param  {Vec2} v Vector to subtract
     * @return {Vec2}   Result
     */
    sub(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    /**
     * Check two vectors for equality
     * @param  {Vec2 | null}        v Vector to check
     * @return {boolean}              Result
     */
    equals(v: Vec2 | null): boolean {
        if (v == undefined || v == null) return false;
        return this.x == v.x && this.y == v.y;
    }
    /**
     * Linearly interpolate between this vector and another
     * @param  {Vec2}   v Other vector to interpolate towards
     * @param  {number} t How much to interpolate [0, 1]
     * @return {Vec2}     Result
     */
    lerp(v: Vec2, t: number): Vec2 {
        t = Math.min(1, Math.max(0, t));

        return this.add(v.sub(this).scale(t));
    }
};

export function hexDist(a: Vec2, b: Vec2): number {
    const az = -a.x - a.y;
    const bz = -b.x - b.y;

    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(az - bz));
}

export function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(v, min));
}
