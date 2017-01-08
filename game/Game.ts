/**
 * @file game/Game.ts
 * Functionality and datastructure related to actually playing a match
 */

import { Vec2 } from "./Math"
import { HexGrid } from "./HexGrid"
import { Ship, ShipClass, Jumper, Fighter, Vanguard } from "./Ship";
import { Action, ActionType } from "./Action"
import { Player, PlayerID } from "./Player"
import { Pilot } from "./Pilot";


import { Blaster } from "./items/Blaster";
import { SuicideBomb } from "./items/SuicideBomb";
import { EagleEye } from "./items/EagleEye";

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
    /* Create a ship, pilot, and gun */
    let mypilot = new Pilot("Han Solo", [2, 2, 2]);
    let myship = new Ship("Falcon", PlayerID.PLAYER_1, Fighter, mypilot, destroyShip);

    myship.equip(new Blaster(), 0);
    myship.equip(new EagleEye(), 1);

    let pilot2 = new Pilot("Chewy", [1, 1, 3]);
    let ship2 = new Ship("IDK", PlayerID.PLAYER_1, Vanguard, pilot2, destroyShip);

    let [h, _] = state.hangers;
    h.push(ship2);

    let opilot = new Pilot("Darth Vader", [1, 3, 1]);
    let oship = new Ship("TIE Fighter", PlayerID.PLAYER_2, Jumper, opilot, destroyShip);
    let ogun = new Blaster();

    oship.equip(ogun, 0);

    /* Place on the map */
    myship.deploy(new Vec2(0, 0));
    oship.deploy(new Vec2(0, -1));
    state.grid.set(myship.position!, myship);
    state.grid.set(oship.position!, oship);
    /** END DEBUG STATE SETUP *************************************************/

    /* Bind event handlers */
    function destroyShip(ship: Ship): void{
         console.assert(ship!.position! != null);

         state.grid.set(ship!.position!, null);
    }

    /**
     * Perform an action on behalf of a player
     * @param {PlayerID} player ID of player making action
     * @param {Action}   action Action to make
     */
    function makeAction(player: PlayerID, action: Action): void {
        if (state.current_player != player) return;

        console.log("Player %d", player);
        console.log("Current player: %d", state.current_player);
        state = state.do(action);
        console.log("Current player: %d", state.current_player);


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

        /* Process turn on game objects */
        for (let [loc, ship] of state.grid.cells) {
            if (ship != null && ship.player != state.current_player) {
                ship.processTurnEnd();
            }
        }

        state.turn_start = Date.now();

        turn_timeout = <any>setTimeout(function() {
            makeAction(state.current_player,
                       new Action(ActionType.END_TURN, null, null, null));
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

/**
 * Describes the state of the game. This structure contains all the data needed
 * to represent the game internally. Any state needed for visualization purposes
 * (hovering grid cells, etc) is maintained exclusively on the client side
 */
export class GameState {
    players: [Player, Player];
    grid: HexGrid<Ship | null>;                  /* Grid state                */
    current_player: PlayerID;                    /* Current player            */
    hangers: [Ship[], Ship[]];                   /* Undeployed ships for each
                                                    player */
    turn_start: number;

    constructor(players: [Player, Player]) {
        this.players = players;
        this.grid = new HexGrid<Ship | null>((pos) => { return null; } );
        this.current_player = PlayerID.PLAYER_1;
        this.turn_start = Date.now();
        this.hangers = [[], []];
    };
    /**
     * Perform an action, modifying the game state
     * @param  {Action}    action Action to perform
     * @return {GameState}        Resulting game state
     */
    do(action: Action): GameState {
        let ship = (action.source != null) ? this.getShip(action.source)! : null;

        switch(action.type) {
            case ActionType.DEPLOY:
                if (ship!.deploy(action.target!)) {
                    this.grid.set(ship!.position!, ship);

                    let [hanger, other] = this.hangers;
                    if (ship!.player == PlayerID.PLAYER_2) hanger = other;

                    hanger.splice(hanger.indexOf(ship!), 1);
                }
                break;
            case ActionType.ACTIVATE:
                ship!.useItem(action.slot!, action.target, this);
                break;
            case ActionType.MOVE:
                /* TODO: Validate this action */
                let old_pos = ship!.position;
                if (ship!.move(action.target!)) {
                    this.grid.set(old_pos!, null);
                    this.grid.set(ship!.position!, ship);
                }
                return this;
            case ActionType.END_TURN:
                this.current_player = Player.other(this.current_player);
                return this;
        }

        return this;
    }
    /**
     * Get a ship by id
     * @param  {number} id ID of ship to get
     * @return {Ship}      Ship or null if no ship exists
     */
    getShip(id: number): Ship | null {
        /* Search grid */
        for (let [loc, ship] of this.grid.cells) {
            if (ship && ship.id == id) return ship
        }

        const [p1hanger, p2hanger] = this.hangers;

        for (let ship of p1hanger) {
            if (ship.id == id) return ship;
        }

        for (let ship of p2hanger) {
            if (ship.id == id) return ship;
        }

        return null;

    }
};
