/**
 * @file game/Action.ts
 */
import { Entity, EntityID } from "./Entity"
import { Vec2 } from "./Math"
import { Item, ItemID } from "./components/Item"
import { Movement } from "./components/Positioning"
import { Deployable } from "./components/Deployable"

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
     * @return {boolean}         Whether or not execution was successful
     */
    abstract execute(): boolean;
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

    execute(): boolean {
        const entity = Entity.getEntity(this._id);

        if (entity == null) return false;

        const movement_comp = entity.getComponent(Movement);

        if (movement_comp == null) return false;

        return movement_comp.moveTo(this._dest);
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
    private readonly _entity_id: EntityID;
    /**
     * Slot the desired item is in
     * @type {number}
     */
    private readonly _item_id: ItemID;
    /**
     * Target (if required)
     * @type {EntityID}
     */
    private readonly _target: EntityID | null;

    constructor(id: EntityID, item: ItemID, target: EntityID | null) {
        super(ActionType.ACTIVATE);

        this._entity_id = id;
        this._item_id = id;
        this._target = target;
    }

    execute(): boolean {
        const entity = Entity.getEntity(this._entity_id);

        if (entity == null) return false;

        const items = entity.getComponents(Item);
        let item: Item | null = null;

        for (const i of items) {
            if (i.id == this._item_id) {
                item = i;
                break;
            }
        }

        if (item == null) return false;

        return item.use(this._target);

    }
}

export class Deploy extends Action {
    private _id: EntityID;
    private _dest: Vec2;

    constructor(id: EntityID, dest: Vec2) {
        super(ActionType.DEPLOY);

        this._id = id;
        this._dest = dest;
    }

    execute(): boolean {
        const entity = Entity.getEntity(this._id);

        if (entity == null) return false;

        const deployable = entity.getComponent(Deployable);

        if (deployable == null) return false;

        return deployable.deploy(this._dest);
    }
}
