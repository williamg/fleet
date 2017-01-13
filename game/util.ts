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
        if (logLevel >= level)  {
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
