/**
 * @file game/System.ts
 * Systems act on components and implement the bulk of the game's logic
 * Systems should have minimal state--that should be contained in the
 * components they act on. The advantage to this is that we don't have to do
 * any client-server synchronization on the systems, just the components.
 */
import { Component, ComponentID, ComponentType } from "./Component"
import { Entity } from "./Entity"
import { GameState, GameStateChanger } from "./GameState"
import { IDPool } from "./IDPool"
import { Vec2 } from "./Math"
import { Observer } from "./util"

import { Map } from "immutable"

type SystemEvent = "move" | "deploy"

export type DeployEvent = {
    changer: GameStateChanger,
    deployed: Entity,
    dest: Entity,
    index: number
};
export type MoveEvent = {
    changer: GameStateChanger,
    moved: Entity,
    from: Vec2
};

type ItemEventData = {
    changer: GameStateChanger
    entity: Entity,
    index: number,
    targets: Vec2[],
};

export class SystemObserver {
    public readonly general: Observer<SystemEvent>;
    public readonly items: Observer<string, ItemEventData>;

    constructor() {
        this.general = new Observer<SystemEvent>();
        this.items = new Observer<string, ItemEventData>();
    }
}

type SystemCtor<T> = new (id_pool: IDPool, observer: SystemObserver,
                          systems: SystemRegistry, state: GameState) => T;

/**
 * Keeps track of all the systems in the game
 */
export class SystemRegistry {
    private readonly _id_pool: IDPool;
    private readonly _observer: SystemObserver;
    private _state: GameState;
    private _systems: Map<SystemCtor<System>, System>

    constructor(id_pool: IDPool, state: GameState) {
        this._id_pool = id_pool;
        this._observer = new SystemObserver();
        this._state = state;
        this._systems = Map<SystemCtor<System>, System>();
    }
    /**
     * Register a system
     *
     * @param {SystemCtor<System>} ctor Constructor function for the system
     */
    public register(ctor: SystemCtor<System>): void {
        const system =
            new ctor(this._id_pool, this._observer, this, this._state);
        this._systems = this._systems.set(ctor, system);
    }
    /**
     * Lookup a registered system
     *
     * @param  {SystemCtor<T>} ctor Constructor of system to lookup
     * @return {T}                  System
     * @throws {Error}              If no such system was registered
     */
    public lookup<T extends System>(ctor: SystemCtor<T>): T {
        const system = this._systems.get(ctor);

        if (system == undefined) {
            throw new Error("Request for unregistered system!");
        } else {
            return system as T;
        }
    }
    /**
     * Called when a turn ends
     */
    public processTurnEnd(state: GameStateChanger): void {
        for (const system of this._systems.values()) {
            system.processTurnEnd(state);
        }
    }
    /**
     * Called when state is updated
     */
    public setState(state: GameState): void {
        this._state = state;

        for (const system of this._systems.values()) {
            system.setState(state);
        }
    }
    /**
     * Called whenever an entity gets created
     *
     * @param {Entity}    entity Entity created
     * @param {GameState} state  Current game state
     */
    public entityCreated(entity: Entity, state: GameState): void {
        for (const system of this._systems.values()) {
            system.entityCreated(entity, state);
        }
    }
    /**
     * Called whenever an entity gets destroyed
     *
     * @param {Entity}    entity Entity destroyed
     * @param {GameState} state  Current game state
     */
    public entityDestroyed(entity: Entity, state: GameState): void {
        for (const system of this._systems.values()) {
            system.entityDestroyed(entity, state);
        }
    }
    /**
     * Called whenever a component gets added to an entity
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component attached
     * @param {GameState} state  Current game state
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        for (const system of this._systems.values()) {
            system.componentAttached(entity, comp, state);
        }
    }
    /**
     * Called whenever a component gets updated 
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component updated
     * @param {GameState} state  Current game state
     */
    public componentUpdated(entity: Entity, comp: Component, state: GameState):
        void {
        for (const system of this._systems.values()) {
            system.componentUpdated(entity, comp, state);
        }
    }
    /**
     * Called whenever a component gets removed from an entity
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component detached
     * @param {GameState} state  Current game state
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        for (const system of this._systems.values()) {
            system.componentDetached(entity, comp, state);
        }
    }
}


export abstract class System {
    protected readonly _id_pool: IDPool;
    protected readonly _observer: SystemObserver;
    protected readonly _systems: SystemRegistry;
    protected _state: GameState;

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        this._id_pool = id_pool;
        this._observer = observer;
        this._systems = systems;
        this._state = state;
    }
    public setState(state: GameState): void {
        this._state = state;
    }
    /**
     * Called when a turn ends
     */
    public processTurnEnd(state: GameStateChanger): void {
    }
    /**
     * Called whenever an entity gets created
     *
     * @param {Entity}    entity Entity created
     * @param {GameState} state  Current game state
     */
    public entityCreated(entity: Entity, state: GameState): void {}
    /**
     * Called whenever an entity gets destroyed
     *
     * @param {Entity}    entity Entity destroyed
     * @param {GameState} state  Current game state
     */
    public entityDestroyed(entity: Entity, state: GameState): void {}
    /**
     * Called whenever a component gets added to an entity
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component attached
     * @param {GameState} state  Current game state
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {}
    /**
     * Called whenever a component gets updated 
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component updated
     * @param {GameState} state  Current game state
     */
    public componentUpdated(entity: Entity, comp: Component, state: GameState):
        void {}
    /**
     * Called whenever a component gets removed from an entity
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component detached
     * @param {GameState} state  Current game state
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {}


}
