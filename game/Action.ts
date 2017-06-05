/**
 * @file game/Action.ts
 */
import { Entity } from "./Entity"
import { GameStateChanger } from "./GameState"
import { GameSystems } from "./GameSystems"
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
     * @param {GameSystems}      systems    Game systems
     */
    public abstract execute(state: GameStateChanger,
                            systems: GameSystems): void;
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

    public execute(changer: GameStateChanger, systems: GameSystems): void {
        systems.movement.move(changer, systems, this.entity, this.dest);
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

    public execute(changer: GameStateChanger, systems: GameSystems): void {
        systems.deploy.deploy(changer, systems, this.entity, this.deploy_entity,
                              this.target_index);
    }
}

