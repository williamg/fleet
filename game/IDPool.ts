/**
 * @file game/IDPool.ts
 * Since the server will have multiple games going on simultaneously, we don't
 * want to have one giant entity set. Instead, each game will have its own
 * IDPool which generates entity and component ids for that game
 */
import { Entity } from "./Entity"
import { ComponentID } from "./Component"
import { Map } from "immutable"

export class IDPool {
    /**
     * Next entity to use
     * @type {Entity}
     */
    private _next_entity: Entity = 0;
    /**
     * Next component ID to use
     * @type {ComponentID}
     */
    private _next_comp_id: ComponentID = 0;
    /**
     * Create a new entity pool
     */
    constructor() {
    }

    public entity(): Entity {
        return this._next_entity++;
    }
    public component(): ComponentID {
        return this._next_comp_id++;
    }

}
