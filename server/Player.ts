/**
 * @file game/Player.ts
 */

import { GameStateChanger } from "../game/GameState"
import { Vec2 } from "../game/Math"
import { TeamID } from "../game/components/Team"
import { Change } from "../game/Changes"
import { MatchInfo } from "../game/MatchInfo"

import { EventEmitter } from "events"
import { List } from "immutable"

/**
 * A player is how the game logic represents a...player. The primary function
 * is to serve as the "deliverer" of player actions
 */
export abstract class Player extends EventEmitter {
    public readonly display_name: string;
    public readonly team: TeamID;

    constructor(display_name: string, team: TeamID) {
        super();

        this.display_name = display_name;
        this.team = team;
    }
    /**
     * Handle a match found
     *
     * @param {MatchInfo} info Match info
     */
    public abstract matchFound(info: MatchInfo): void;
    /**
     * Initialize the entities for this player
     *
     * @param {GameStateChanger} state Initial state to populate
     */
    public abstract initEntities(state: GameStateChanger): void;
    /**
     * Handle a set of changes made to the game state
     * @param {List<Change>} Set of changes
     */
    public abstract handleChanges(changeset: List<Change>): void;
}

