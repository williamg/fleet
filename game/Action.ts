/**
 * @file game/Action.ts
 */

import { Vec2 } from "./Math";

export enum ActionType {
    MOVE,
    ACTIVATE,
    DEPLOY,
    END_TURN
};

/*
 *
 * Actions are the fundamental buildign blocks of the game. Each player's turn
 * consists of performing some number of actions. There are 3 principle actions:
 *
 *  - MOVE: The most prevalent action is the movement of ally ships from one
 *    location to another.
 *  - USE: Another common action is using one of the items with which your ship
 *    is equipped.
 *  - DEPLOY: Finally, the least frequent action is deploying one of your ships
 *    from your mothership's hanger to the battlefield
 */
export class Action {
    readonly type: ActionType;        /* Type of action being performed       */
    readonly source: number | null;   /* ID of ship performing action         */
    readonly slot: number | null;     /* Slot (if applicable) of item         */
    readonly target: Vec2 | null;     /* Array of arguments                   */

    constructor(type: ActionType, source: number | null, slot: number | null,
                target: Vec2 | null) {
        this.type = type;
        this.source = source;
        this.slot = slot;
        this.target = target;
    }
};
