/**
 * @file game/filters/Matches.ts
 */
import { Entity } from "../Entity"
import { Filter } from "../Filter"

/**
 * Filter based on a known list. Can be used to emulate "is one of" with custom
 * euqality operator
 */
export class Matches<T, V> extends Filter<T> {
    private readonly _source_list: V[];
    private readonly _comp: (t: T, v: V) => boolean;

    constructor(source_list: V[], comp: (t: T, v: V) => boolean) {
        super();

        this._source_list = source_list;
        this._comp = comp;
    }

    matches(val: T): boolean {
        for (let v of this._source_list) {
            if (this._comp(val, v)) return true;
        }

        return false;
    }
}
