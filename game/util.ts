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

export class Observer<EventType extends string> extends EventEmitter {
    constructor(max: number = 10) {
        super();
        this.setMaxListeners(max);
    }
    public emit(event: EventType, data?: any): boolean {
        return super.emit(event, data);
    }
    public on(event: EventType, fn: (data: any) => void): this {
        return super.on(event, fn);
    }
    public once(event: EventType, fn: (data: any) => void): this {
        return super.once(event, fn);
    }
    public removeListener(event: EventType, fn: (data: any) => void): this {
        return super.removeListener(event, fn);
    }
    public removeAllListeners(event: EventType): this {
        return super.removeAllListeners(event);
    }
    public addListener(event: EventType, fn: (data: any) => void): this {
        return super.addListener(event, fn);
    }
}
