/**
 * @file game/Action.ts
 */
import { Entity } from "./Entity"
import { GameStateChanger } from "./GameState"
import { IDPool } from "./IDPool"
import { Messengers } from "./Messenger"
import { UpdateComponent, AttachComponent, DetachComponent } from "./Changes"
import { Vec2 }  from "./Math"

import { ComponentType } from "./Component"
import { HexPosition, newHexPosition } from "./components/HexPosition"
import { DeployZone } from "./components/DeployZone"
import { Deployable } from "./components/Deployable"

/**
 * Type of action
 */
export enum ActionType {
    MOVE,
    DEPLOY,
};
/*
 * Actions are the primary interface betwene player and game. Each player's turn
 * consists exclusively of performing some number of actions.
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
     * @param {GameStateChanger} changer    Current state changer
     * @param {Messengers}       messengers Messengers object
     * @param {IDPool}           id_pool    IDPool
     */
    public abstract execute(state: GameStateChanger, messengers: Messengers,
                            id_pool: IDPool): void;
};
/**
 * Move an entity from one cell to another
 */
export class Move extends Action {
    /**
     * Entity being moved
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * Location to which the ship is being moved
     * @type {[number, number]}
     */
    public readonly dest: Vec2;

    constructor(entity: Entity, dest: Vec2) {
        super(ActionType.MOVE);

        this.entity = entity;
        this.dest = dest;
    }

    public execute(changer: GameStateChanger, messengers: Messengers,
                   id_pool: IDPool): void {
        let pos = changer.state.getComponent<HexPosition>(
            this.entity, ComponentType.HEX_POSITION);

        if (pos == undefined) return;

        const old_pos = new Vec2(pos!.data.x, pos!.data.y);

        /* Announce that we're about to move the entity */
        const res = messengers.beforeMove.publish({
            entity: this.entity,
            to: this.dest
        }, changer);

        /* If everyone's okay with us moving the entity, move it, and then tell
         * everyone we moved it
         */
        if (res) {
            pos = pos.with({ x: this.dest.x, y: this.dest.y });

            changer.makeChange(new UpdateComponent(pos));

            messengers.afterMove.publish({
                entity: this.entity,
                from: old_pos
            }, changer);
        }
    }
}
/**
 * Deploy a ship from the hanger to the grid
 */
export class Deploy extends Action {
    /**
     * Entity being deployed
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * Entity providing the deploy zone
     * @type {Entity}
     */
    public readonly deploy_entity: Entity;
    /**
     * Index into that entity's target array providing the final location
     * @type {number}
     */
    public readonly target_index: number;

    constructor(entity: Entity, deploy_entity: Entity, target_index: number) {
        super(ActionType.DEPLOY);

        this.entity = entity;
        this.deploy_entity = deploy_entity;
        this.target_index = target_index;
    }

    public execute(changer: GameStateChanger, messengers: Messengers,
                   id_pool: IDPool): void {
        const data = {
            deploying: this.entity,
            dest: this.deploy_entity,
            index: this.target_index
        }

        const res = messengers.beforeDeploy.publish(data, changer);

        if (res) {
            const deployable = changer.state.getComponent<Deployable>(
                this.entity, ComponentType.DEPLOYABLE)!;
            const deploy_loc = changer.state.getComponent<HexPosition>(
                this.deploy_entity, ComponentType.HEX_POSITION)!;
            const zone = changer.state.getComponent<DeployZone>(
                this.deploy_entity, ComponentType.DEPLOY_ZONE)!;

            const pos = newHexPosition(id_pool.component(), {
                x: zone.data.targets[this.target_index].x + deploy_loc.data.x,
                y: zone.data.targets[this.target_index].y + deploy_loc.data.y
            });

            changer.makeChange(new DetachComponent(this.entity, deployable));
            changer.makeChange(new AttachComponent(this.entity, pos));

            messengers.afterDeploy.publish(data, changer);
        }
    }
}

