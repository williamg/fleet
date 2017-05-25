/**
 * @file game/Player.ts
 */

import { Activate, Action, ActionType } from "../game/Action"
import { GlobalState } from "../game/GlobalState"
import { Vec2 } from "../game/Math"
import { TeamID } from "../game/components/Team"
import { EventEmitter } from "events"

/**
 * A player is how the game logic represents a...player. The primary function
 * is to serve as the "deliverer" of player actions
 */
export abstract class Player extends EventEmitter {
    public readonly display_name: string;
    public readonly team: TeamID;

    constructor(display_name: string, team: TeamID, id: number) {
        super();

        this.display_name = display_name;
        this.team = team;
    }
    /**
     * Update the state of a player, probably as a result of performing an
     * action
     * @param {GlobalState} state New state
     */
    public abstract update(state: GlobalState): void;
}

