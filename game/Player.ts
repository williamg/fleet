/**
 * @file game/Player.ts
 */

import { EndTurn, Activate, Action, ActionType } from "./Action";
import { GameState } from "./../game/Game";
import { Vec2 } from "./Math"
import { EntityType } from "./GridEntity"
import { Ship } from "./Ship"

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
    private made_move: boolean;

    constructor() {
        super("AI Player");

        this.id = null;
        this.action_cb = null;
        this.made_move = false;
    }

    init(id: PlayerID, state: GameState, action_cb: ActionCB): void {
        this.id = id;
        this.action_cb = action_cb;
        this.made_move = false;
    }

    setState(state: GameState): void {
        if (state.current_player != this.id) return;

        /* If I've made my move, end my turn */
        if (this.made_move) {
            this.made_move = false;
            this.action_cb!(new EndTurn());
            return;
        }

        /* If it's my turn and I have an item, try to use it and then end my
         * turn
         */

        /* Find a ship that's mine */
        for (let [loc, entity] of state.grid.cells) {
            if (entity == null || entity.type != EntityType.SHIP) continue;
            if (entity.player != this.id) continue;

            let ship = entity as Ship;

            for (let i  = 0; i < ship.items.length; ++i) {
                const item = ship.items[i];

                if (item == null) continue;

                let desc = item.targetRequired();
                let target: Vec2 | null = null;

                if (desc != null) {
                    for (let [loc, _] of state.grid.cells) {
                        if (desc.matches(loc, state)) {
                            target = loc;
                        }
                    }
                }


                const action = new Activate(ship.id, i, target);
                this.made_move = true;
                this.action_cb!(action);
                return;
            }
        }

        /* Couldn't find an item to use, just end turn */
        this.action_cb!(new EndTurn());
    }
}
