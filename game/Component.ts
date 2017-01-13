/**
 * @file game/Component.ts
 */
import { LOG, ASSERT } from "./util"
import { Entity } from "./Entity"

/**
 * Components are used to make entities interesting. Components provide almost
 * all of the core game functionality from basic movement to unique items.
 * Components are independent except when they're not :P. If a component
 * *requires* another component to function, then it must be constructed with
 * a reference to that component. Otherwise, components broadcast messages to
 * the parent entity which are forwarded to all of that entity's other
 * components. Components can also communicate directly with other entities
 * by calling that entity's public messengers
 */
export abstract class Component {
    /**
     * The entity this component is assigned to. Components must be assigned to
     * an entity and cannot be re-assigned to a different entity.
     * @type {Entity}
     */
    readonly entity: Entity;
    /**
     * Set of components that depend on this component
     * @type {Set<Component>}
     */
    private readonly _dependents: Set<Component> = new Set<Component>();

    constructor(entity: Entity) {
        this.entity = entity;
    }
    /**
     * Adds a dependency between this component and another. As a result, if
     * this component is removed, the dependent component is also removed.
     * @param {Component} dependent Dependent component
     */
    addDependent(dependent: Component): void {
        if (!this._dependents.has(dependent)) {
            this._dependents.add(dependent);
        }
    }
    /**
     * Called when this component is added to an entity to determine the order
     * it will receive the stateChange event relative to other components.
     * @return {number} Priority
     */
    stateChangePriority(): number { return 0; }
    /**
     * Called when some other entity has modified the global state. The new
     * state can be accessed through this component's entity
     * (this.entity.global_state). This handler should NOT modify the global
     * state.
     *
     * TODO: Ideally, I'd like the global_state to be immutable here; should
     * investigate ImmutableJS integration in t he future.
     */
    onGlobalStateChange(): void {};
    /**
     * Called when the player that owns the entity of this component ends their
     * turn.
     */
    processTurnEnd(): void {}
    /**
     * Called when this component is removed from the entity (also, if the
     * entity is destroyed before this component is removed)
     */
    onRemove(): void {
        /* This loop is written as a while loop rather than a for..each to
         * avoid issues with circular dependencies */
        while (this._dependents.size > 0) {
            const dependent = this._dependents.values().next().value;
            this._dependents.delete(dependent);

            this.entity.removeComponent(dependent);
        }
    }
}
