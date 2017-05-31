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
import { Messengers } from "./Messenger"
import { IDPool } from "./IDPool"

export abstract class System {
    protected readonly _id_pool: IDPool;
    protected readonly _messengers: Messengers;

    constructor(id_pool: IDPool, messengers: Messengers) {
        this._id_pool = id_pool;
        this._messengers = messengers;
    }
    /**
     * Called when a turn ends
     */
    public processTurnEnd(state: GameStateChanger | undefined): void {}
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
     * Called whenever a component gets removed from an entity
     *
     * @param {Entity}    entity Entity
     * @param {Component} comp   Component detached
     * @param {GameState} state  Current game state
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {}


}
