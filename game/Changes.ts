/**
 * @file game/Changeset.ts
 * Classes related to the representation of discrete changes made to a GameState
 * for sending deltas to the client
 */
import { GameState } from "./GameState"
import { Entity } from "./Entity"
import { Component, ComponentID } from "./Component"
import { Team } from "./components/Team"
import { Seq, Set, Map } from "immutable"

export enum ChangeType {
    START_GAME,
    CREATE_ENT,
    DESTROY_ENT,
    UPDATE_COMP,
    DETACH_COMP,
    ATTACH_COMP,
    END_TURN,
};

/**
 * Represents a single change that can be applied to a changeset
 */
export abstract class Change {
    /**
     * Type of change this is
     * @type {ChangeType}
     */
    public readonly type: ChangeType;
    /**
     * Constructor
     *
     * @param {ChangeType} type Change type
     */
    public constructor(type: ChangeType) {
        this.type = type;
    }
    /**
     * Apply this change to the provided game state
     *
     * @param  {GameState} state State to which change should be applied
     * @return {GameState}       Resulting game state
     * @throws {Error}           If change is incompatible with provided state
     */
    public abstract apply(state: GameState): GameState;
};
/**
 * Change that results in the game starting
 */
export class StartGame extends Change {
    /**
     * Constructor
     */
    public constructor() {
        super(ChangeType.START_GAME);
    }
    /**
     * Start the game state. Fails if the given state is already started.
     */
    public apply(state: GameState): GameState {
        if (state.started) {
            throw new Error("Attempting to start game already started");
        }

        return state.with({ started: true });
    }
};
/**
 * Change that results in a new entity being created
 */
export class CreateEntity extends Change {
    /**
     * Entity that was created
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * Constructor
     */
    public constructor(entity: Entity) {
        super(ChangeType.CREATE_ENT);

        this.entity = entity;
    }
    /**
     * Create a new entity. Fails if the entity already exists.
     *
     * Note: It is important that all systems are notified of the new entity
     * after this change is applied.
     */
    public apply(state: GameState): GameState {
        if (state.entities.has(this.entity)) {
            throw new Error("Attempting to create entity that already exists");
        }

        const entities = state.entities.set(this.entity, Set<ComponentID>());
        return state.with({ entities: entities });
    }
};
/**
 * Change that results in an entity being destroyed
 */
export class DestroyEntity extends Change {
    /**
     * Entity to be destroyed
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * Constructor
     */
    public constructor(entity: Entity) {
        super(ChangeType.DESTROY_ENT);

        this.entity = entity;
    }
    /**
     * Destroy the entity. Fails if the entity doesn't exist
     *
     * Note: It is important that all systems are notified after this entity is
     * destroyed
     */
    public apply(state: GameState): GameState {
        if (!state.entities.has(this.entity)) {
            throw new Error("Attempting to destroy entity that doesn't exist");
        }

        const comp_ids = state.entities.get(this.entity)!;
        const entities = state.entities.delete(this.entity);

        let components = state.components;

        /* TODO: Replace this with components.deleteAll(comp_ids) once 
         * Immutable.js 4.0 is released
         */
        for (const id of comp_ids) {
            components = components.delete(id);
        };

        return state.with({ entities: entities, components: components });
    }
};
/**
 * Change that results in a component being updated
 */
export class UpdateComponent extends Change {
    /**
     * The updated component
     * @type {Component}
     */
    public readonly component: Component;
    /**
     * Constructor
     */
    public constructor(component: Component) {
        super(ChangeType.UPDATE_COMP);

        this.component = component;
    }
    /**
     * Change the component. Fails if the component doesn't exist
     */
    public apply(state: GameState): GameState {
        if (!state.components.has(this.component.id)) {
            throw new Error("Attempting to update component that doesn't exist");
        }

        const components =
            state.components.set(this.component.id, this.component);

        return state.with({ components: components });
    }
};
/**
 * Change that results in a component being detachd
 */
export class DetachComponent extends Change {
    /**
     * The entity the component was detachd from
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * The component that was detachd
     * @type {Component}
     */
    public readonly component: Component;
    /**
     * Constructor
     */
    public constructor(entity: Entity, component: Component) {
        super(ChangeType.DETACH_COMP);

        this.entity = entity;
        this.component = component;
    }
    /**
     * Detach the component. Fails if the entity or component doesn't
     * exist, or if the entity doesn't contain this component
     *
     * Note: It is important that all systems are notified after this entity is
     * destroyed
     */
    public apply(state: GameState): GameState {
        if (!state.entities.has(this.entity)) {
            throw new Error("Attempting to detach component from entity that " +
                            "doesn't exist");
        }

        const comp_ids =
            state.entities.get(this.entity)!.delete(this.component.id)!;

        if (!comp_ids.includes(this.component.id)) {
            throw new Error("Attempting to detach component that doesn't " +
                            "exist on entity");
        } else if (!state.components.has(this.component.id)) {
            throw new Error("Attempting to detach component that doesn't " +
                            "exist");
        }

        const entities = state.entities.set(this.entity, comp_ids);
        const components = state.components.delete(this.component.id);

        return state.with({ entities: entities, components: components });
    }
};
/**
 * Change that results in a new component being attached to an entity
 */
export class AttachComponent extends Change {
    /**
     * The entity to which the component should be attached
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * The component being attached
     * @type {Component}
     */
    public readonly component: Component;
    /**
     * Constructor
     */
    public constructor(entity: Entity, component: Component) {
        super(ChangeType.ATTACH_COMP);

        this.entity = entity;
        this.component = component;
    }
    /**
     * Attach the component. Fails if the entity doesn't exist or the component
     * already exists
     *
     * Note: It is important that all systems are notified after this entity is
     * destroyed
     */
    public apply(state: GameState): GameState {
        if (!state.entities.has(this.entity)) {
            throw new Error("Attempting to attach component to entity that " +
                            "doesn't exist");
        }

        if (state.components.has(this.component.id)) {
            throw new Error("Attempting to attach component that already " +
                            "exists");
        }

        let comp_ids = state.entities.get(this.entity)!;

        /* If this error gets thrown things are super weird since we already
         * checked that the component doesn't exist at all...
         */
        if (comp_ids.includes(this.component.id)) {
            throw new Error("Attempting to attach entity that is already " +
                            "attached");
        }

        comp_ids = comp_ids.add(this.component.id);
        const entities = state.entities.set(this.entity, comp_ids);
        const components =
            state.components.set(this.component.id, this.component);

        return state.with({ entities: entities, components: components });
    }

};

export class EndTurn extends Change {
    /**
     * Constructor
     */
    public constructor() {
        super(ChangeType.END_TURN);
    }
    /**
     * End the turn. Fails if the game is not started.
     *
     * Note: It is important that all systems are notified of the ending of the
     * turn
     */
    public apply(state: GameState): GameState {
        if (!state.started) {
            throw new Error("Attempting to end turn in game not started");
        }

        const current_team = Team.other(state.current_team);

        return state.with({
            current_team: current_team,
            turn_start: Date.now()
        });
    }
};
