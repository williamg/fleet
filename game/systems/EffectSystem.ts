/**
 * @file game/EffectSystem.ts
 * Keeps track of effects active on entities
 */
import { System, SystemObserver, SystemRegistry } from "../System"
import { IDPool } from "../IDPool"
import { Entity } from "../Entity"
import { Component, ComponentID, ComponentType, ComponentImpl, FIRST_EFFECT }
    from "../Component"
import { GameState } from "../GameState"
import { ASSERT } from "../util"
import { EffectData } from "../components/Effect"

import { Map, List } from "immutable"

function isEffect (type: ComponentType): boolean {
    return type >= FIRST_EFFECT;
}

export type EffectInfo = {
    name: string,
    icon: string,

}

export class EffectSystem extends System {
    /**
     * Map of entities to effect components
     * @type {Map<Entity, List<ComponentID>>}
     */
    private _effects: Map<Entity, List<ComponentID>> =
        Map<Entity, List<ComponentID>>();

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);
    }
    /**
     * Handle an entity being created
     * @see System.entityCreated
     */
    public entityCreated(entity: Entity, state: GameState): void {
        this._effects = this._effects.set(entity, List<ComponentID>());
    }
    /**
     * Handle an entity being destroyed
     * @see System.entityDestroyed
     */
    public entityDestroyed(entity: Entity, state: GameState): void {
        this._effects = this._effects.delete(entity);
    }
    /**
     * Handle a Items component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (!isEffect(comp.type)) {
            return;
        }

        const effects = this._effects.get(entity)!;

        ASSERT(effects != undefined);

        this._effects = this._effects.set(entity, effects.push(comp.id));
    }
    /**
     * Handle a Items component being detached from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (!isEffect(comp.type)) {
            return;
        }

        const effects = this._effects.get(entity)!;

        ASSERT(effects != undefined);

        const index = effects.indexOf(comp.id);

        ASSERT(index >= 0);

        this._effects = this._effects.set(entity, effects.delete(index));
    }
    /**
     * Get all status effects affecting a particular entity
     * @param  {Entity}                              entity Entity
     * @return {List<ComponentImpl<EffectData<any>>>}       List of components
     */
    public getEffects(entity: Entity): List<ComponentImpl<EffectData<any>>> {
        const effects = this._effects.get(entity);

        ASSERT(effects != undefined);

        return effects!.map((id) => {
            const comp = this._state.components.get(id)!;

/*            if (isEffect(comp)) {
                return comp;
            }*/

            throw new Error("Bad effect component");
        });
    }
}
