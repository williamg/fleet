/**
 * @file game/Action.ts
 */

import { Vec2, hexDist } from "./Math"
import { GameState } from "./Game"
import { EntityType, EntityID } from "./GridEntity"
import { Ship } from "./Ship"
import { TargetDescription } from "./Target"
import { Player, PlayerID } from "./Player"
import { DeployPad } from "./DeployPad"

/**
 * Type of action
 */
export enum ActionType {
    MOVE,
    ACTIVATE,
    DEPLOY,
    END_TURN
};
/*
 * Actions are the fundamental building blocks of the game. Each player's turn
 * consists of performing some number of actions.
 */
export abstract class Action {
    /**
     * Type of action
     * @type {ActionType}
     */
    readonly type: ActionType;

    constructor(type: ActionType) {
        this.type = type;
    }
    /**
     * Execute an action
     * @param  {GameState} state State to modify
     * @return {boolean}         Whether or not execution was successful
     */
    abstract execute(state: GameState): boolean;
};
/**
 * Move an entity from one cell to another
 */
export class Move extends Action {
    /**
     * ID of ship being moved
     * @type {EntityID}
     */
    private readonly _id: EntityID;
    /**
     * Location to which the ship is being moved
     * @type {Vec2}
     */
    private readonly _dest: Vec2;

    constructor(id: EntityID, dest: Vec2) {
        super(ActionType.MOVE);

        this._id = id;
        this._dest = dest;
    }

    execute(state: GameState): boolean {
        const entity = state.getEntity(this._id);

        if (entity == null || entity.type != EntityType.SHIP) return false;

        const ship = entity as Ship;
        const old_pos = ship.position;

        if (ship.move(this._dest)) {
            state.grid.set(old_pos, null);
            state.grid.set(ship.position, ship);
        }

        return true;
    }
}
/**
 * Use a ship's item
 */
export class Activate extends Action {
    /**
     * ID of ship item is equipped on
     * @type {EntityID}
     */
    private readonly _id: EntityID;
    /**
     * Slot the desired item is in
     * @type {number}
     */
    private readonly _slot: number;
    /**
     * Target (if required)
     * @type {Target}
     */
    private readonly _target: Vec2 | null;

    constructor(id: EntityID, slot: number, target: Vec2 | null) {
        super(ActionType.ACTIVATE);

        this._id = id;
        this._slot = slot;
        this._target = target;
    }

    execute(state: GameState): boolean {
        const entity = state.getEntity(this._id);

        if (entity == null || entity.type != EntityType.SHIP) return false;

        const ship = entity as Ship;

        ship.useItem(this._slot, this._target, state);
        return true;
    }
}

export class Deploy extends Action {
    private _hanger_index: number;
    private _dest: Vec2;

    constructor(hanger_index: number, dest: Vec2) {
        super(ActionType.DEPLOY);

        this._hanger_index = hanger_index;
        this._dest = dest;
    }

    execute(state: GameState): boolean {
        /* Need to find closest deploy pad */
        let [hanger, other] = state.hangers;
        let dps = DeployPad.P1_TARGETS;
        let target_dp: DeployPad | null = null;

        if (state.current_player == PlayerID.PLAYER_2) {
            hanger = other;
            dps = DeployPad.P2_TARGETS;
        }

        for (let dp of dps) {
            if (hexDist(dp, this._dest) == 1) {
                target_dp = state.grid.at(dp)! as DeployPad;
            }
        }

        if (target_dp == null) return false;

        target_dp.deploy();

        const info = hanger[this._hanger_index];
        hanger.splice(this._hanger_index, 1);

        const ship = info.toShip(this._dest, function(ship: Ship) {
            state.grid.set(ship.position, null);
        });

        state.grid.set(ship.position, ship);

        return true;
    }
}
/**
 * End a player's turn
 */
export class EndTurn extends Action {
    constructor() {
        super(ActionType.END_TURN);
    }

    execute(state: GameState): boolean {
        state.current_player = Player.other(state.current_player);
        return true;
    }
}
