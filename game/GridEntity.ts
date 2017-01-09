/**
 * @item game/GridEntity.ts
 */
import { PlayerID } from "./Player"
import { Vec2 } from "./Math"

/**
 * Unique identitifer assigned to each grid entity
 */
export class EntityID {
    private static _next_id: number = 0;
    private readonly _id: number;

    constructor() {
        this._id = EntityID._next_id++;
    }
}
/**
 * Type of entity
 */
export enum EntityType {
    DEPLOY_PAD,
    SHIP
};
/**
 * Represents anything in the game that can takes up a space on the grid.
 */
export abstract class GridEntity {
    /**
     * Unique identifier for this entity
     * @type {EntityID}
     */
    readonly id: EntityID;
    /**
     * Type of entity
     * @type {EntityType}
     */
    readonly type: EntityType;
    /**
     * Player this entity belongs to. Every entity must have a player so we
     * know when to call processTurnEnd().
     * @type {PlayerID}
     */
    readonly player: PlayerID;
    /**
     * Position on the grid (axial coordinates)
     * @type {Vec2}
     */
    protected _position: Vec2;

    /* Getters/setters */
    get position() { return this._position; }

    constructor(type: EntityType, player: PlayerID, position: Vec2) {
        this.id = new EntityID();
        this.type = type;
        this.player = player;
        this._position = position;
    }

    /* Process this entity at the end of a turn */
    abstract processTurnEnd(): void;
}
