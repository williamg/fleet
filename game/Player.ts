/**
 * @file game/Player.ts
 */

import { Action, ActionType } from "./Action";
import { GameState } from "./../game/Game";

/**
 * There are two players per game
 */
export enum PlayerID {
    PLAYER_1,
    PLAYER_2
};

export type ActionCB = (action: Action) => void;
/**
 * A player is how the game logic represents a...player. The primary function
 * is to serve as the "deliverer" of player actions
 */
export abstract class Player {
    readonly display_name: string;

    constructor(display_name: string) {
        this.display_name = display_name;
    }
    /**
     * Get the other player
     * @param  {PlayerID} player Not the other player
     * @return {PlayerID}        The other player
     */
    static other(player: PlayerID): PlayerID {
        if (player == PlayerID.PLAYER_1) return PlayerID.PLAYER_2;
        return PlayerID.PLAYER_1
    }
    /**
     * Initialize a player, setting the initial state
     * @param {PlayerID}  id        ID of this player
     * @param {GameState} state     Initial game state
     * @param {ActionCB}  action_cb Function to be called whenever the player
     *                              wants to perform an action
     */
    abstract init(id: PlayerID, state: GameState, action_cb: ActionCB): void;
    /**
     * Update the state of a player, probably as a result of performing an
     * action
     * @param {GameState} state New state
     */
    abstract setState(state: GameState): void;
}
/**
 * Simple AI player. Does nothing but end their turn right now.
 * TODO: Make this slightly less stupid;
 */
export class AIPlayer extends Player {
    private id: PlayerID | null;
    private action_cb: ActionCB | null;

    constructor() {
        super("AI Player");

        this.id = null;
        this.action_cb = null;
    }

    init(id: PlayerID, state: GameState, action_cb: ActionCB): void {
        this.id = id;
        this.action_cb = action_cb;
    }

    setState(state: GameState): void {
        if (state.current_player == this.id) {
            this.action_cb!(new Action(ActionType.END_TURN, null, null, null));
        }
    }
}
