/**
 * @file game/Damage.ts
 */

import { Entity } from "./Entity"

export enum DamageResult {
    NORMAL,
    CRIT,
};

export class Damage {
    source: number;
    target: number;
    result: DamageResult;
    amount: number;

    constructor(source: number, target: number, result: DamageResult,
                amount: number) {
        this.source = source;
        this.result = result;
        this.amount = amount;
        this.target = target;
    }
}
