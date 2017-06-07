/**
 * @file game/util.ts
 *
 * Utility & debug functionality
 */

enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
};

/* Options */
const logLevel: LogLevel = LogLevel.DEBUG;
const debug: boolean = true;

function logfn(level: LogLevel, pre: string): (s: string, ...args: any[]) => void {
    function log(s: string, ...args: any[]) {
        if (logLevel <= level)  {
            console.log(pre + " "+ s, args);
        }
    }
    return log;
}

export const LOG = {
    DEBUG: logfn(LogLevel.DEBUG, "[DEBUG]"),
    INFO:  logfn(LogLevel.INFO,  "[INFO ]"),
    WARN:  logfn(LogLevel.WARN,  "[WARN ]"),
    ERROR: logfn(LogLevel.ERROR, "[ERROR ]")
};

export function ASSERT(val: boolean) {
    if (debug) {
        console.assert(val);
    }
}

/**
 * Typed observer
 */
import { EventEmitter } from "events"

export class Observer<EventType extends string, DataType = any> extends EventEmitter {
    constructor(max: number = 10) {
        super();
        this.setMaxListeners(max);
    }
    public emit(event: EventType, data?: DataType): boolean {
        return super.emit(event, data);
    }
    public on(event: EventType, fn: (data: DataType) => void): this {
        return super.on(event, fn);
    }
    public once(event: EventType, fn: (data: DataType) => void): this {
        return super.once(event, fn);
    }
    public removeListener(event: EventType, fn: (data: DataType) => void): this {
        return super.removeListener(event, fn);
    }
    public removeAllListeners(event: EventType): this {
        return super.removeAllListeners(event);
    }
    public addListener(event: EventType, fn: (data: DataType) => void): this {
        return super.addListener(event, fn);
    }
}

/**
 * Priority queue
 *
 * Inefficient, too lazy to implement correctly for now.
 */
export enum Order {
    LESS,
    EQUAL,
    GREATER
}
export type Comparator<T> = (a: T, b: T) => Order;

export class PriorityQueue<T> {
    private readonly _comparator: Comparator<T>;
    private readonly _queue: T[];

    constructor(comparator: Comparator<T>) {
        this._comparator = comparator;
        this._queue = [];
    }

    get size(): number { return this._queue.length; }

    public pop(): T | undefined {
        return this._queue.shift();
    }

    public push(val: T): void {
        for (let i = 0; i < this._queue.length; ++i) {
            if (this._comparator(val, this._queue[i]) == Order.LESS) {
                this._queue.splice(i, 1, val);
                return;
            }
        }

        /* If we didn't return, add it to the end */
        this._queue.push(val);
    }
}
