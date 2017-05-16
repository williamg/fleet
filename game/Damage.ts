/**
 * @file game/Damage.ts
 */
import { EntityID } from "./Entity"

export enum DamageResult {
    NORMAL,
    CRIT,
};

export interface Damage {
    readonly source: EntityID;
    readonly target: EntityID;
    readonly source_type: "ship" | "status efect";
    result: DamageResult;
    amount: number;
};
