/**
 * @file game/GameState.ts
 */
import { Change, ChangeType, StartGame, CreateEntity, DestroyEntity,
    UpdateComponent, DetachComponent, AttachComponent, EndTurn
    } from "./Changes"
import { Component, ComponentType, ComponentID } from "./Component"
import { Entity } from "./Entity"
import { System } from "./System"
import { ASSERT, LOG } from "./util"
import { TeamID, Team } from "./components/Team"
import { Map, Record, Set, List } from "immutable"

/**
 * Describes the parameters of the game state for type-safety during state
 * construction and modification, since Immutable.js records are not typechecked
 */
type GameStateParams = {
    entities?: Map<Entity, Set<ComponentID>>;
    components?: Map<ComponentID, Component>;
    current_team?: TeamID;
    turn_start?: number;
    started?: boolean;
}
/**
 * Immutable.js record type for the game state
 */
const GameStateRecord = Record({
    entities: Map<Entity, Set<ComponentID>>(),
    components: Map<ComponentID, Component>(),
    current_team: TeamID.TEAM_1,
    turn_start: 0,
    started: false
});

/**
 * Complete state of the game. Given this knowledge, one could completely
 * reconstruct the exact state of the game. Note that it is not necessarily
 * the case that both players have a complete copy of the game state at a given
 * time (consider mechanics like "stealh" or "fog of war").
 *
 * This is immutable. To mutate the game state, use a GameStateMutator instance.
 */
export class GameState extends GameStateRecord { 
    /**
     * Maps entities to their components.
     *
     * The map is to ComponentIDs rather than Components to make serialization
     * easy in the case that one component needs to reference another
     * IDs are constant throughout serialization whereas references are not.
     *
     * @type {Map<Entity, Set<ComponentID>>}
     */
    public entities: Map<Entity, Set<ComponentID>>;
    /**
     * Maps component IDs to actual components
     * @type {Map<ComponentID, Component>}
     */
    public components: Map<ComponentID, Component>;
    /**
     * Defines the team/player who is currently able to perform actions
     * @type {TeamID}
     */
    public current_team: TeamID;
    /**
     * The time at which this turn started
     * @type {number}
     */
    public turn_start: number;
    /**
     * Whether or not the game has started
     * @type {boolean}
     */
    public started: boolean;
    /**
     * Construct a new state with the given parameters
     * 
     * @param {GameStateParams} params Parameters to use instead of defaults
     */
    public constructor(params?: GameStateParams) {
        params ? super(params) : super();
    } 
    /**
     * Create a new GameState with the same values as this one except as
     * indicated by the provided values
     * @param {GameStateParams} values Values to replace in the new game state
     */
    public with(values: GameStateParams): GameState {
        return this.merge(values) as this;
    }
    /**
     * Get the set of components associated with a given entity
     *
     * @param  {Entity}         entity Entity of interest
     * @return {Set<Component>}        Set of that entity's components
     */
    public getComponents(entity: Entity): Set<Component> {
        if (!this.entities.has(entity)) {
            LOG.WARN("Getting components of entity that doesn't exist");
            return Set<Component>();
        }

        const comp_ids = this.entities.get(entity)!;

        return Set<Component>(comp_ids.map((id) => {
            return (this.components.get(id!))!;
        }));
    }
    /**
     * Search for a specific component associated with a given entity
     *
     * @param  {Entity}                entity Entity of interest
     * @param  {ComponentType}         comp   Component type to search for
     * @return {Component | undefined}        Component if it exists
     */
    public getComponent<CompType>(entity: Entity, type: ComponentType):
        CompType | undefined {
        const comps = this.getComponents(entity);

        const res = comps.find((comp) => { return comp!.type == type; });

        if (res) {
            return <CompType><any>res;
        }

        return undefined;
    }
}

/**
 * Class to perform operations/mutate the game state. This class keeps track
 * of all changes made and uses them to generate a "changeset" that, when
 * applied to the original state, will result in an identical state
 */
export class GameStateChanger {
    private _state: GameState;
    private _changeset: List<Change>;
    private readonly _systems: System[];

    constructor(state: GameState, systems: System[]) {
        this._state = state;
        this._changeset = List<Change>();
        this._systems = systems;
    }

    /* Define getter, but no setter */
    get state(): GameState {
        return this._state;
    }
    get changeset(): List<Change> {
        return this._changeset;
    }
    /**
     * Apply a change to the game state
     */
    public makeChange(change: Change) {
        this._state = change.apply(this._state);
        this._changeset = this._changeset.push(change);

        /* Notify systems if necessary */
        switch (change.type) {
            case ChangeType.CREATE_ENT: {
                const entity = (change as CreateEntity).entity;

                for (const system of this._systems) {
                    system.entityCreated(entity, this._state);
                }
                return;
            }
            case ChangeType.DESTROY_ENT: {
                const entity = (change as DestroyEntity).entity;

                for (const system of this._systems) {
                    system.entityDestroyed(entity, this._state);
                }
                return;
            }
            case ChangeType.DETACH_COMP: {
                const entity = (change as DetachComponent).entity;
                const comp = (change as DetachComponent).component;

                for (const system of this._systems) {
                    system.componentDetached(entity, comp, this._state);
                }
                return;
            }
            case ChangeType.ATTACH_COMP: {
                const entity = (change as AttachComponent).entity;
                const comp = (change as AttachComponent).component;

                for (const system of this._systems) {
                    system.componentAttached(entity, comp, this._state);
                }
                return;
            }
            case ChangeType.END_TURN: {
                for (const system of this._systems) {
                    system.processTurnEnd(this);
                }
                return;
            }
            default:
                return;
        }
    }

}


