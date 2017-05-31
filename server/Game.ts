/**
 * @file server/Game.ts
 * Functionality and datastructure related to actually playing a match
 */
import { Action, ActionType } from "../game/Action"
import { Entity } from "../game/Entity"
import { IDPool } from "../game/IDPool"
import { GameState, GameStateChanger } from "../game/GameState"
import { Change, StartGame, EndTurn, CreateEntity, AttachComponent } from "../game/Changes"
import { Vec2 } from "../game/Math"
import { Player } from "./Player"
import { Team, TeamID } from "../game/components/Team"
import { LOG } from "../game/util"
import { Messengers } from "../game/Messenger"

import { System } from "../game/System"
import { GridSystem } from "../game/systems/GridSystem"

import { newHexPosition } from "../game/components/HexPosition"

export const END_TURN_EVENT = "endturn";
export const ACTION_EVENT = "action";
export const READY_EVENT = "ready";

/**
 * Maximum turn length in milliseconds
 * @type {Number}
 */
export const TURN_TIMEOUT = 10000;

export class Game {
    /**
     * IDPool for this game
     * @type {IDPool}
     */
    private readonly _id_pool: IDPool = new IDPool();
    /**
     * Messengers for inter-system communication
     * @type {Messengers}
     */
    private readonly _messengers: Messengers = new Messengers();
    /**
     * Systems need to run the game. Note that these systems are ONLY those
     * required to handle user actions and update the state accordingly.
     * In particular, it doesn't include systems for Rendering or AI.
     *
     * @type {System}[]
     */
    private readonly _systems: System[]
    /**
     * Players in the game
     * @type {[Player, Player]}
     */
    private readonly _players: [Player, Player];
    /**
     * Current game state
     * @type {GameState}
     */
    private _state: GameState = new GameState();
    /**
     * Readys received from players
     * @type {[boolean, boolean]}
     */
    private _readys: [boolean, boolean];
    /**
     * Handle for turn timer
     * @type {number | null}
     */
    private _turn_timeout: number | null = null;
    /**
     * Setup a new game between two players
     *
     * @param {[Player, Player]} players Players in the game
     */
    constructor(_players: [Player, Player]) {
        this._systems = [
            new GridSystem(this._id_pool, this._messengers)
        ];
        this._players = _players;
        this._readys = [false, false];

        /* Install event handlers */
        const [p1, p2] = this._players;

        for (const p of this._players) {
            p.on(END_TURN_EVENT, () => {
                this.endTurn(p.team);
            });
            p.on(ACTION_EVENT, (action: Action) => {
                this.handleAction(p.team, action);
            });
            p.on(READY_EVENT, () => {
                this.ready(p.team);
            });
        }

        /* Initialize entities */
        const changer = new GameStateChanger(this._state, this._systems);
        this.initEntities(changer);
        p1.initEntities(changer);
        p2.initEntities(changer);

        p1.handleChanges(changer.changeset);
        p2.handleChanges(changer.changeset);
    }
    /**
     * Initialize any entities needed for the game to get underway
     *
     * @param {GameStateChanger} state Game state
     */
    private initEntities(state: GameStateChanger): void {
        /* Initialize two entities for testing purposes */
        const e1 = this._id_pool.entity();
        const e2 = this._id_pool.entity();

        state.makeChange(new CreateEntity(e1));
        state.makeChange(new CreateEntity(e2));

        const p1 = newHexPosition(this._id_pool.component(), { x: 0, y: 1 });
        const p2 = newHexPosition(this._id_pool.component(), { x: 1, y: 0 });

        state.makeChange(new AttachComponent(e1, p1));
        state.makeChange(new AttachComponent(e2, p2));
    }
    /**
     * Handle a ready from the given player
     *
     * @param {TeamID} team Team of player ready
     */
    private ready(team: TeamID): void {
        let [ra, rb] = this._readys;
        let [pa, pb] = this._players;

        if (pa.team == team) {
            ra = true;
        } else {
            rb = true;
        }

        this._readys = [ra, rb];

        if (ra && rb) {
            LOG.INFO("Both players ready, starting game.");
            this.startGame();
        }
    }
    /**
     * Start the game
     */
    private startGame(): void {
        const player = this.getCurrentPlayer();

        const mutable_state = new GameStateChanger(this._state, this._systems);
        mutable_state.makeChange(new StartGame());
        this._state = mutable_state.state;

        this._turn_timeout = <any>setTimeout(() => {
            this.endTurn(player.team);
        }, TURN_TIMEOUT);

        const [p1, p2] = this._players;
        p1.handleChanges(mutable_state.changeset);
        p2.handleChanges(mutable_state.changeset);
    }
    /**
     * Handle an action from a player
     *
     * @param {TeamID} team   Team performing the action
     * @param {Action} action Action to perform
     */
    public handleAction(team: TeamID, action: Action) {
        const player = this.getCurrentPlayer();

        if (player.team != team) return;

        const mutable_state = new GameStateChanger(this._state, this._systems);

        action.execute(mutable_state, this._messengers);

        const [p1, p2] = this._players;
        p1.handleChanges(mutable_state.changeset);
        p2.handleChanges(mutable_state.changeset);
    }
    /**
     * End the current turn
     *
     * @param {TeamID} team Team trying to end turn
     */
    public endTurn(team: TeamID): void {
        const player = this.getCurrentPlayer();

        if (player.team != team) return;

        if (this._turn_timeout != null) {
            clearTimeout(this._turn_timeout);
        }

        const mutable_state = new GameStateChanger(this._state, this._systems);
        mutable_state.makeChange(new EndTurn());
        this._state = mutable_state.state;

        this._turn_timeout = <any>setTimeout(() => {
            this.endTurn(player.team);
        }, TURN_TIMEOUT);

        const [p1, p2] = this._players;
        p1.handleChanges(mutable_state.changeset);
        p2.handleChanges(mutable_state.changeset);
    }
    /**
     * Get the current player
     *
     * @return {Player} Current player
     */
    private getCurrentPlayer(): Player {
        const [p1, p2] = this._players;

        if (this._state.current_team == p1.team) return p1;
        return p2;
    }
}
