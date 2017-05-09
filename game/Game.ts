/**
 * @file game/Game.ts
 * Functionality and datastructure related to actually playing a match
 */
import { Action, ActionType } from "./Action"
import { Entity } from "./Entity"
import { GlobalState } from "./GlobalState"
import { HexGrid } from "./HexGrid"
import { Vec2 } from "./Math"
import { newShip, newDeployPad, ShipClass, Jumper, Fighter, Vanguard } from "./Ship";
import { Player, PlayerID } from "./Player"
import { Team } from "./components/Team"


/**
 * Maximum turn length in milliseconds
 * @type {Number}
 */
export const TURN_TIMEOUT = 10000;

/**
 * Determine whether or not the game is over
 * @param  {GlobalState} state Current game state
 * @return {boolean}           Whether or not the game is over
 */
function gameOver(state: GlobalState): boolean {
    return false;
}

/**
 * Start a game between the provided players
 * @param {[Player, Player]} players Players in the game
 */
export function startGame(players: [Player, Player]): void {
    let state = new GlobalState();
    let turn_timeout: number | null = null;

    /** DEBUG STATE SETUP *****************************************************/
    const ship = newShip(state, Jumper, "Falcon", PlayerID.PLAYER_1, "Han Solo", [2, 2, 2]);
    const dp = newDeployPad(state, new Vec2(0, 0), PlayerID.PLAYER_1);

    //const oship = newShip(Vanguard, PlayerID.PLAYER_2, "Darth Vade", [1, 4, 1]);
    //const oblaster = newBlaster(oship);
    /** END DEBUG STATE SETUP *************************************************/

    let [p1, p2] = players;

    /**
     * Perform an action on behalf of a player
     * @param {PlayerID} player ID of player making action
     * @param {Action}   action Action to make
     */
    function makeAction(player: PlayerID, action: Action): void {
        if (state.current_player != player) return;

        /* We assume that if the action fails, no state change occurred, so we
         * just return silently
         */
        if (!action.execute()) return;

        if (gameOver(state)) {
            console.log("Game over!");
            return;
        }

        p1.update(state);
        p2.update(state);
    }
    /**
     * Advance to the next turn
     */
    function startTurn(): void {
        state.turn_start = Date.now();
        turn_timeout = <any>setTimeout(endTurn, TURN_TIMEOUT);

        p1.update(state);
        p2.update(state);
    }
    /**
     * End the current turn
     */
    function endTurn(): void {
        if (turn_timeout != null) {
            clearTimeout(turn_timeout);
        }

        for (let entity of Entity.all()) {
            const team = entity.getComponent(Team);

            if (team == null) continue;
            if (team.team != state.current_player) continue;

            entity.processTurnEnd();
        }

        state.current_player = Player.other(state.current_player);
        state.messenger.publish(state);
        startTurn();
    }

    /* Initialize players */
    p1.init(PlayerID.PLAYER_1, state, (action) => {
        makeAction(PlayerID.PLAYER_1, action);
    }, () => {
        if (state.current_player == PlayerID.PLAYER_1) {
            endTurn();
        }
    });
    p2.init(PlayerID.PLAYER_2, state, (action) => {
        makeAction(PlayerID.PLAYER_2, action);
    }, () => {
        if (state.current_player == PlayerID.PLAYER_2) {
            endTurn();
        }
    });

    /* Set things in motion */
    startTurn();
}
