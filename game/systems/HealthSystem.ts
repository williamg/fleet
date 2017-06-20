/**
 * @file game/HealthSystem.ts
 * Processes health on entities
 */
import { System, SystemObserver, SystemRegistry } from "../System"
import { IDPool } from "../IDPool"
import { Entity } from "../Entity"
import { Component, ComponentType } from "../Component"
import { GameState, GameStateChanger } from "../GameState"
import { UpdateComponent } from "../Changes"
import { ASSERT } from "../util"
import { clamp } from "../Math"
import { Health } from "../components/Health"

import { List } from "immutable"

export class HealthSystem extends System {
    /**
     * List of entities with health
     * @type {List<Entity>}
     */
    private _entities: List<Entity> = List<Entity>();

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);
    }
    /**
     * Handle a Health component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.HEALTH) {
            this._entities = this._entities.push(entity);
        }
    }
    /**
     * Handle a Health component being detached from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.HEALTH) {
            const index = this._entities.indexOf(entity);

            if (index >= 0) {
                this._entities = this._entities.delete(index);
            }
        }
    }
    /**
     * Modify an entity's health. If an entity's health drops to 0, the entity
     * is destroyed
     *
     * @param {Entity}           entity  Entity to modify
     * @param {number}           amount  Amount by which to change health
     * @param {GameStateChanger} changer Game state changer
     */
    public incrementHealth(entity: Entity, amount: number,
                           changer: GameStateChanger): void {
        const health_comp = this._state.getComponent<Health>(
            entity, ComponentType.HEALTH)!;

        const value = clamp(0, health_comp.data.current + amount,
                            health_comp.data.capacity);

        if (value == 0) {
            /* Destroy entity */
            ASSERT(false);
        } else {
            const new_health_comp = health_comp.with({
                current: value
            });

            changer.makeChange(new UpdateComponent(new_health_comp));
        }
    }
}
