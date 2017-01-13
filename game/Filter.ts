/**
 * @file game/Filter.ts
 */

/**
 * Filters provide a simple interface to build poewrful functions to select
 * certain entities/locations.
 */
export abstract class Filter<T> {
    constructor() {}
    /**
     * Given an array of values, return an array of those that satisfy the
     * filter. Note that the default implementation simply calls matches() on
     * each element. Subclasses should override this if there is a faster
     * method.
     * @param  {T[]} vals Array of unfiltered values
     * @return {T[]}      Filtered values
     */
    filter(vals: T[]): T[] {
        return vals.filter(this.matches.bind(this));
    }
    /**
     * Determine if val passes the filter
     * @param  {T}       val Value to check
     * @return {boolean}     True if it matches, false otherwise
     */
    abstract matches(val: T): boolean

    /* Useful composition functions */
    and(other: Filter<T>): Filter<T> {
        return new CombinationFilter<T>(this, other, (x, y) => (x && y));
    }

    or(other: Filter<T>): Filter<T> {
        return new CombinationFilter<T>(this, other, (x, y) => (x || y));
    }

    xor(other: Filter<T>): Filter<T> {
        return new CombinationFilter<T>(this, other,
            (x, y) => ((x && !y) || (!x && y)));
    }

    not(): Filter<T> {
        return new NegationFilter<T>(this);
    }

}

type CombineFn = (a: boolean, b: boolean) => boolean;

class CombinationFilter<T> extends Filter<T> {
    private readonly _a: Filter<T>;
    private readonly _b: Filter<T>;
    private readonly _combine: CombineFn;

    constructor(a: Filter<T>, b: Filter<T>, combine: CombineFn) {
        super();

        this._a = a;
        this._b = b;
        this._combine = combine;
    }

    /* Override the default implementation so that we use the potentially more
     * efficient versions provided by subclasses
     */
    filter(vals: T[]): T[] {
        const aSet = new Set<T>(this._a.filter(vals));
        const bSet = new Set<T>(this._b.filter(vals));

        /* Compute union */
        const union = aSet;
        for (const elem of bSet) {
            union.add(elem);
        }

        const filtered: T[] = [];

        for (const elem of union) {
            if (this._combine(aSet.has(elem), bSet.has(elem))) {
                filtered.push(elem);
            }
        }

        return filtered;
    }

    matches(val: T): boolean {
        return this._combine(this._a.matches(val), this._b.matches(val));
    }
}

class NegationFilter<T> extends Filter<T> {
    private readonly _filter: Filter<T>;

    constructor(filter: Filter<T>) {
        super();

        this._filter = filter;
    }

    filter(vals: T[]): T[] {
        const original = new Set<T>(vals);
        const result = new Set<T>(this._filter.filter(vals));

        const filtered: T[] = [];

        for (const elem of original) {
            if (!result.has(elem)) {
                filtered.push(elem);
            }
        }

        return filtered;
    }

    matches(val: T): boolean {
        return !this._filter.matches(val);
    }
}
