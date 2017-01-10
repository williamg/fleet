/**
 * @file game/Game.ts
 * Functionality and datastructure related to actually playing a match
 */

import { Vec2 } from "./Math"
import { HexGrid } from "./HexGrid"
import { GridEntity, EntityID } from "./GridEntity"
import { ShipInfo, Ship, ShipClass, Jumper, Fighter, Vanguard } from "./Ship";
import { ShipItem } from "./ShipItem"
import { Action, ActionType, EndTurn } from "./Action"
import { Player, PlayerID } from "./Player"
import { Pilot } from "./Pilot";
import { DeployPad } from "./DeployPad"


import { Blaster } from "./items/Blaster";
import { SuicideBomb } from "./items/SuicideBomb";
import { EagleEye } from "./items/EagleEye";

function testShip1(): ShipInfo {
    let pilot = new Pilot("Han Solo", [2, 2, 2]);
    let items: ShipItem[] = [new Blaster(), new EagleEye()];
    let ship = new ShipInfo("Falcon", PlayerID.PLAYER_1, Fighter, pilot, items);

    return ship;
}

function testShip2(): ShipInfo {
    let pilot = new Pilot("Darth Vader", [1, 2, 3]);
    let items: ShipItem[] = [new Blaster()];
    let ship = new ShipInfo("TIE Fighter", PlayerID.PLAYER_2, Jumper, pilot, items);

    return ship;
}

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
    let [h1, h2] = state.hangers;
    h1.push(testShip1());
    h1.push(testShip1());
    h1.push(testShip1());
    h1.push(testShip1());

    state.grid.set(new Vec2(0, 0), testShip1().toShip(new Vec2(0, 0), destroyEntity));
    state.grid.set(new Vec2(0, -1), testShip2().toShip(new Vec2(0, -1), destroyEntity));

    /** END DEBUG STATE SETUP *************************************************/

    /* Bind event handlers */
    function destroyEntity(entity: GridEntity): void{
         state.grid.set(entity.position, null);
    }

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

        /* Process turn on game objects */
        for (let [loc, ship] of state.grid.cells) {
            if (ship != null && ship.player != state.current_player) {
                ship.processTurnEnd();
            }
        }

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

/**
 * Describes the state of the game. This structure contains all the data needed
 * to represent the game internally. Any state needed for visualization purposes
 * (hovering grid cells, etc) is maintained exclusively on the client side
 */
export class GameState {
    players: [Player, Player];
    grid: HexGrid<GridEntity | null>;            /* Grid state                */
    current_player: PlayerID;                    /* Current player            */
    hangers: [ShipInfo[], ShipInfo[]];           /* Undeployed ships for each
                                                    player */
    turn_start: number;

    constructor(players: [Player, Player]) {
        this.players = players;
        this.grid = new HexGrid<Ship | null>((pos) => { return null; } );
        this.current_player = PlayerID.PLAYER_1;
        this.turn_start = Date.now();
        this.hangers = [[], []];

        function destroyEntity(e: GridEntity) {
            this.grid.set(e.position, null);
        }

        for (let loc of DeployPad.P1_TARGETS) {
            this.grid.set(loc, new DeployPad(PlayerID.PLAYER_1, loc, destroyEntity.bind(this)));
        }
        for (let loc of DeployPad.P2_TARGETS) {
            this.grid.set(loc, new DeployPad(PlayerID.PLAYER_2, loc, destroyEntity.bind(this)));
        }
    };
    /**
     * Get an entity by id
     * @param  {EntityID} id ID of entity to get
     * @return {Ship}      Ship or null if no ship exists
     */
    getEntity(id: EntityID): GridEntity | null {
        /* Search grid */
        for (let [loc, entity] of this.grid.cells) {
            if (entity && entity.id == id) return entity
        }

        return null;

    }
};
