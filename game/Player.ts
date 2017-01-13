/**
 * @file game/Player.ts
 */

import { Activate, Action, ActionType } from "./Action";
import { GlobalState } from "./GlobalState"
import { Vec2 } from "./Math"

/**
 * There are two players per game
 */
export enum PlayerID {
    PLAYER_1,
    PLAYER_2
};

export type ActionCB = (action: Action) => void;
export type EndTurnCB = () => void;
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
     * @param {PlayerID}    id        ID of this player
     * @param {GlobalState} state     Initial game state
     * @param {ActionCB}    actionFn  Function to be called whenever the player
     *                                wants to perform an action
     * @param {EndTurnCB}   endTurnFn Function to be called whenever the player
     *                                is ready to end their turn
     */
    abstract init(id: PlayerID, state: GlobalState, actionFn: ActionCB,
                  endTurnFn: EndTurnCB): void;
    /**
     * Update the state of a player, probably as a result of performing an
     * action
     * @param {GlobalState} state New state
     */
    abstract update(state: GlobalState): void;
}
/**
 * Simple AI player. Does nothing but end their turn right now.
 * TODO: Make this slightly less stupid;
 */
export class AIPlayer extends Player {
    private id: PlayerID | null;
    private actionFn: ActionCB | null;
    private endTurnFn: EndTurnCB | null;
    private made_move: boolean;

    constructor() {
        super("AI Player");

        this.id = null;
        this.actionFn = null;
        this.endTurnFn = null;
        this.made_move = false;
    }

    init(id: PlayerID, state: GlobalState, actionFn: ActionCB,
         endTurnFn: EndTurnCB): void {
        this.id = id;
        this.actionFn = actionFn;
        this.endTurnFn = endTurnFn;
        this.made_move = false;
    }

    update(state: GlobalState): void {
        if (state.current_player != this.id) return;

        this.endTurnFn!();
    }
}
