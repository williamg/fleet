/**
 * @file game/HangerSystem.ts
 * Keeps track of the entities in each player's hanger
 */
import { System } from "../System"
import { IDPool } from "../IDPool"
import { Messengers } from "../Messenger"
import { Entity } from "../Entity"
import { Component, ComponentType } from "../Component"
import { GameState } from "../GameState"
import { Deployable } from "../components/Deployable"
import { Team, TeamID } from "../components/Team"

import { List } from "immutable"

export class HangerSystem extends System {
    /**
     * List of deployable entities
     * @type {List<Entity>}
     */
    private _entities: List<Entity> = List<Entity>();

    constructor(id_pool: IDPool, messengers: Messengers, state: GameState) {
        super(id_pool, messengers, state);
    }
    /**
     * Entity getter
     */
    public get entities(): List<Entity> {
        return this._entities;
    }
    /**
     * Handle a Deployable component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.DEPLOYABLE) {
            this._entities = this._entities.push(entity);
        }
    }
    /**
     * Handle a Deployable component being detached from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.DEPLOYABLE) {
            const index = this._entities.indexOf(entity);

            if (index > 0) {
                this._entities = this._entities.delete(index);
            }
        }
    }
}
