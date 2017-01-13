/**
 * @file game/Game.ts
 * Functionality and datastructure related to actually playing a match
 */

import { Vec2 } from "./Math"
import { HexGrid } from "./HexGrid"
import { newShip, ShipClass, Jumper, Fighter, Vanguard } from "./Ship";
import { Action, ActionType, EndTurn } from "./Action"
import { HexPosition } from "./Components"
import { Player, PlayerID } from "./Player"
import { itemSystem } from "./systems/ItemSystem"
import { timeoutWatcher } from "./systems/TimeoutWatcher"


import { newBlaster } from "./items/Blaster";

/**
 * Maximum turn length in milliseconds
 * @type {Number}
 */
export const TURN_TIMEOUT = 10000;

/**
 * Determine whether or not the game is over
 * @param  {GameState} state Current game state
 * @return {boolean}         Whether or not the game is over
 */
function gameOver(state: GameState): boolean {
    return false;
}

/**
 * Start a game between the provided players
 * @param {[Player, Player]} players Players in the game
 */
export function startGame(players: [Player, Player]): void {
    let state = new GameState(players);
    let turn_timeout: number | null = null;

    /** DEBUG STATE SETUP *****************************************************/
    const ship = newShip(Jumper, PlayerID.PLAYER_1, "Han Solo", [2, 2, 2]);
    const blaster = newBlaster(ship);

    const oship = newShip(Vanguard, PlayerID.PLAYER_2, "Darth Vade", [1, 4, 1]);
    const oblaster = newBlaster(oship);

    ship.addComponent(HexPosition, ship.id, new Vec2(0, 0));
    oship.addComponent(HexPosition, oship.id, new Vec2(-1, 0));

    /** END DEBUG STATE SETUP *************************************************/

    /**
     * Perform an action on behalf of a player
     * @param {PlayerID} player ID of player making action
     * @param {Action}   action Action to make
     */
    function makeAction(player: PlayerID, action: Action): void {
        if (state.current_player != player) return;

        action.execute(state);

        if (gameOver(state)) {
            console.log("Game over!");
            return;
        }

        /* If the turn ended, start the next turn */
        if (state.current_player != player) {
            nextTurn();
        }

        let [p1, p2] = state.players;
        p1.setState(state);
        p2.setState(state);
    }
    /**
     * Advance to the next turn
     */
    function nextTurn(): void {
        if (turn_timeout != null) {
            clearTimeout(turn_timeout);
        }

        itemSystem.processTurnEnd(Player.other(state.current_player));
        timeoutWatcher.processTurnEnd(Player.other(state.current_player));

        state.turn_start = Date.now();

        turn_timeout = <any>setTimeout(function() {
            makeAction(state.current_player, new EndTurn());
        }, TURN_TIMEOUT);
    }

    /* Initialize thee players */
    let [player1, player2] = players;

    player1.init(PlayerID.PLAYER_1, state, (action) => {
        makeAction(PlayerID.PLAYER_1, action);
    });
    player2.init(PlayerID.PLAYER_2, state, (action) => {
        makeAction(PlayerID.PLAYER_2, action);
    });

    /* Set things in motion */
    nextTurn();
}

export class GameState {
    players: [Player, Player];
    current_player: PlayerID;                    /* Current player            */
    turn_start: number;

    constructor(players: [Player, Player]) {
        this.players = players;
        this.current_player = PlayerID.PLAYER_1;
        this.turn_start = Date.now();
    };
};
