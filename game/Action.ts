/**
 * @file game/Action.ts
 */
import { Entity } from "./Entity"
import { GameStateChanger } from "./GameState"
import { SystemRegistry } from "./System"
import { IDPool } from "./IDPool"
import { UpdateComponent, AttachComponent, DetachComponent } from "./Changes"
import { Vec2 }  from "./Math"

import { ComponentType } from "./Component"
import { HexPosition, newHexPosition } from "./components/HexPosition"
import { DeployZone } from "./components/DeployZone"
import { Deployable } from "./components/Deployable"

import { MovementSystem } from "./systems/MovementSystem"
import { DeploySystem } from "./systems/DeploySystem"
import { ItemSystem } from "./systems/ItemSystem"

/**
 * Type of action
 */
export enum ActionType {
    MOVE,
    DEPLOY,
    USE_ITEM
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
     * @param {SystemRegistry}   systems    System registry
     */
    public abstract execute(state: GameStateChanger,
                            systems: SystemRegistry): void;
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

    public execute(changer: GameStateChanger, systems: SystemRegistry): void {
        const move_system = systems.lookup(MovementSystem);
        move_system.move(changer, this.entity, this.dest);
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

    public execute(changer: GameStateChanger, systems: SystemRegistry): void {
        const deploy_system = systems.lookup(DeploySystem);
        deploy_system.deploy(changer, this.entity, this.deploy_entity,
                             this.target_index);
    }
}
/**
 * Use an item on a ship
 */
export class UseItem extends Action {
    /**
     * Entity with item being used
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * Index of item being used
     * @type {number}
     */
    public readonly index: number;
    /**
     * Target
     * @type {Vec2 | undefined}
     */
    public readonly target: Vec2 | undefined;

    constructor(entity: Entity, index: number, target: Vec2 | undefined) {
        super(ActionType.USE_ITEM);

        this.entity = entity;
        this.index = index;
        this.target = target;
    }

    public execute(changer: GameStateChanger, systems: SystemRegistry): void {
        const item_system = systems.lookup(ItemSystem);
        item_system.useItem(changer, this.entity, this.index, this.target);
    }
}

