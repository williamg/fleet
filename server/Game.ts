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
import { LOG } from "../game/util"

import { SystemRegistry } from "../game/System"
import { GridSystem } from "../game/systems/GridSystem"
import { DeploySystem } from "../game/systems/DeploySystem"
import { PowerSystem } from "../game/systems/PowerSystem"
import { MovementSystem } from "../game/systems/MovementSystem"
import { ItemSystem } from "../game/systems/ItemSystem"

import { newTeam, Team, TeamID } from "../game/components/Team"
import { newHexPosition } from "../game/components/HexPosition"
import { newDeployZone } from "../game/components/DeployZone"
import { newName } from "../game/components/Name"
import { newPowerSource, PowerType } from "../game/components/PowerSource"

export const END_TURN_EVENT = "endturn";
export const ACTION_EVENT = "action";
export const READY_EVENT = "ready";

/**
 * Maximum turn length in milliseconds
 * @type {Number}
 */
export const TURN_TIMEOUT = 30000;

export class Game {
    /**
     * IDPool for this game
     * @type {IDPool}
     */
    private readonly _id_pool: IDPool = new IDPool();
    /**
     * System registry
     * @type {SystemRegistry}
     */
    private readonly _systems: SystemRegistry;
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

        /* Register systems */
        this._systems = new SystemRegistry(this._id_pool, this._state);
        this._systems.register(DeploySystem);
        this._systems.register(GridSystem);
        this._systems.register(MovementSystem);
        this._systems.register(PowerSystem);
        this._systems.register(ItemSystem);

        /* Initialize entities */
        const changer = new GameStateChanger(this._state, this._systems);
        this.initEntities(changer);
        p1.initEntities(changer, this._id_pool);
        p2.initEntities(changer, this._id_pool);

        this._state = changer.state;
        this._systems.setState(this._state);

        /* FIXME: Delay added to give GUI a chance to catch up */
        setTimeout(() => {
            p1.handleChanges(changer.changeset);
            p2.handleChanges(changer.changeset);
        }, 500);

    }
    /**
     * Initialize any entities needed for the game to get underway
     *
     * @param {GameStateChanger} state Game state
     */
    private initEntities(state: GameStateChanger): void {
        const locs = [
            { x: 4, y: 0},
            { x: -4, y: 0},
            { x: 0, y: 3},
            { x: 0, y: -3},
            { x: -4, y: 4},
            { x: 4, y: -4}
        ];

        const dzdata = {
            targets: [
                { x: -1, y: 0},
                { x: 1, y: 0},
                { x: -1, y: 1},
                { x: 1, y: -1},
                { x: 0, y: 1},
                { x: 0, y: -1},
            ]
        }

        for (let i = 0; i < locs.length; ++i) {

            const dp = this._id_pool.entity();

            const pos = newHexPosition(this._id_pool.component(), locs[i]);
            const zone = newDeployZone(this._id_pool.component(), dzdata);
            const name = newName(this._id_pool.component(), {
                name: `Deploy Zone ${i}`
            });
            const team = newTeam(this._id_pool.component(), {
                team: (i % 2) ? TeamID.TEAM_2 : TeamID.TEAM_1
            });
            const power = newPowerSource(this._id_pool.component(), {
                type: PowerType.SOLAR,
                capacity: 100,
                current: 100,
                recharge: 25
            });

            state.makeChange(new CreateEntity(dp));
            state.makeChange(new AttachComponent(dp, pos));
            state.makeChange(new AttachComponent(dp, zone));
            state.makeChange(new AttachComponent(dp, name));
            state.makeChange(new AttachComponent(dp, team));
            state.makeChange(new AttachComponent(dp, power));
        }

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
        const mutable_state = new GameStateChanger(this._state, this._systems);
        mutable_state.makeChange(new StartGame());
        this._state = mutable_state.state;

        this._turn_timeout = <any>setTimeout(() => {
            this.endTurn(this._state.current_team);
        }, TURN_TIMEOUT);

        this._systems.setState(this._state);

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
        if (team != this._state.current_team) return;

        const mutable_state = new GameStateChanger(this._state, this._systems);

        action.execute(mutable_state, this._systems);
        this._state = mutable_state.state;
        this._systems.setState(this._state);

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
        if (team != this._state.current_team) return;

        if (this._turn_timeout != null) {
            clearTimeout(this._turn_timeout);
        }

        const mutable_state = new GameStateChanger(this._state, this._systems);
        this._systems.processTurnEnd(mutable_state);

        mutable_state.makeChange(new EndTurn());
        this._state = mutable_state.state;

        this._systems.setState(this._state);

        this._turn_timeout = <any>setTimeout(() => {
            this.endTurn(this._state.current_team);
        }, TURN_TIMEOUT);

        const [p1, p2] = this._players;
        p1.handleChanges(mutable_state.changeset);
        p2.handleChanges(mutable_state.changeset);
    }
}
