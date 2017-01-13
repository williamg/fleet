/**
 * @file game/Entity.ts
 *
 * "Why build a game when we could build an entity-component system instead?"
 *
 * Game objects are represented by entities, which are themselves collections
 * of components. Entities can communicate directly with another entity by
 * calling that entity's "receive" method. If an entity modifies a global
 * state object, that change is broadcast to all other entities.
 */
 import { Component } from "./Component"
 import { GlobalState } from "./GlobalState"
 import { Messenger, SubscriberID } from "./Messenger"
 import { LOG, ASSERT } from "./util"

 /* Message types */
 import { Damage } from "./Damage"

/* EntityIDs should be treated as disctinct from "number" whenever possible.
 * Don't do myvar: EntityID = anotherID + 1; */
export type EntityID = number;

export class Entity {
    /***************************
     * Global entity managment *
     ***************************/

    private static _next_id = 0;
    /**
     * Map holding onto references to all active entities to prevent garbage
     * collection and provide easy access for e.g. the renderer.
     * @type {Map<EntityID, Entity>}
     */
    private static _entities: Map<EntityID, Entity> =
        new Map<EntityID, Entity>();
    /**
     * Get an entity with a specific ID
     * @param  {EntityID} id ID of entity to search for
     * @return {Entity}      Entity with that ID
     */
    static getEntity(id: EntityID): Entity | null {
        return Entity._entities.get(id) || null;
    }
    /**
     * Get all active entities
     * @return {IterableIterator<Entity>} Entity iterable
     */
    static all(): IterableIterator<Entity> {
        return Entity._entities.values();
    }

    /**
     * ID of this entity
     * @type {EntityID}
     */
    readonly id: EntityID = Entity._next_id++;
    /**
     * Most recent global state
     * @type {GlobalState}
     */
    global_state: GlobalState;
    /**
     * Components attached to this entity
     * @type {Map<Component, SubscriberID>}
     */
    private readonly _components: Map<Component, SubscriberID> =
        new Map<Component, SubscriberID>();
    /**
     * ID of the subscriber that notifies this entity of changes to the global
     * state
     * @type {SubscriberID}
     */
    private readonly _global_state_sub: SubscriberID;
    /**
     * Messenger used to notify this entity's components of changes to the
     * global state
     * @type {Messenger<GlobalState>}
     */
    private readonly stateMessenger: Messenger<GlobalState> =
        new Messenger<GlobalState>();
    /**
     * Expose messengers to facilitate communication between components & other
     * entities
     */
    readonly damageMessenger: Messenger<Damage> = new Messenger<Damage>();
    readonly destroyMessenger: Messenger<Damage> = new Messenger<Damage>();

    constructor(initial_state: GlobalState) {
        Entity._entities.set(this.id, this);
        this.global_state = initial_state;
        this._global_state_sub =
            initial_state.messenger.subscribe(this.setState.bind(this), 0);
    }
    /**
     * Destroy this entity, freeing it to be garbage collected if no other
     * references exist.
     */
    destroy(): void {
        LOG.DEBUG("Destroying entity " + this.id.toString());
        for (const component of this._components.keys()) {
            this.removeComponent(component);
        }
        ASSERT(this._components.size == 0);

        Entity._entities.delete(this.id);
    }
    /**
     * Called by Gthe global state messenger when changes occur
     * @param  {GlobalState} state New global state. Should be trated as
     *                             immutable
     */
    setState(state: GlobalState): void {
        this.global_state = state;
        this.stateMessenger.publish(state);
    }
    /**
     * Called when the player that owns the entity of this component ends their
     * turn.
     */
    processTurnEnd(): void {
        for (const component of this._components.keys()) {
            component.processTurnEnd();
        }
    }

    /***********************
     * Component Managment *
     ***********************/

    /**
     * Add a component to this entity.
     *
     * Example: adding a Charge component which has a constructor:
     *  new Charge(entity: Entity, max_charge: number, recharge: number)
     * Usage:
     *  let charge: Charge =
     *      entity.addComponent(Charge, entity, max_charge, recharge_);
     * @param  {{ new (..args: any[]): T;}} componentType Component constructor
     * @param  {any}                        args          Constructor args
     * @return {T}                                        Component instance
     */
    addComponent<T extends Component>(
        componentType: { new (...args: any[]): T;}, ...args: any[]): T {
        const instance = new componentType(...args);
        const sub_id = this.stateMessenger.subscribe(
            instance.onGlobalStateChange.bind(instance),
            instance.stateChangePriority()
        );
        this._components.set(instance, sub_id);

        return instance;
    }
    /**
     * Get a component of the given type from this entity
     * @param  {{ new (..args: any[]): T;}} componentType Component constructor
     * @return {T | null}                                  Instance if available
     */
    getComponent<T extends Component>(
        componentType: { new (...args: any[]): T; }): T | null {
        for (const component of this._components.keys()) {
            if (component instanceof componentType) {
                return component;
            }
        }

        return null;
    }
    /**
     * Get all components of a given type from this entity
     * @param  {{ new (..args: any[]): T;}} componentType Component constructor
     * @return {T[]}                                      Array of instances
     */
    getComponents<T extends Component>(
        componentType: { new (...args: any[]): T; }): T[] {
        let components: T[] = [];

        for (const component of this._components.keys()) {
            if (component instanceof componentType) {
                components.push(component);
            }
        }

        return components;
    }
    /**
     * Remove a component from this entity
     * @param {Component} component Component to remove
     */
    removeComponent(component: Component): void {
        const sub_id = this._components.get(component);

        if (sub_id != undefined) {
            this.stateMessenger.unsubscribe(sub_id);
            component.onRemove();
            this._components.delete(component);
        }
    }
}
