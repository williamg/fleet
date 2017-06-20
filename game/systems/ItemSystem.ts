/**
 * @file game/ItemSystem.ts
 * Processes items on entities
 */
import { System, SystemObserver, SystemRegistry } from "../System"
import { IDPool } from "../IDPool"
import { Entity } from "../Entity"
import { Component, ComponentType } from "../Component"
import { GameState, GameStateChanger } from "../GameState"
import { UpdateComponent } from "../Changes"
import { ASSERT } from "../util"
import { Vec2 } from "../Math"

import { Items, ItemsData } from "../components/Items"
import { PowerSource, PowerType } from "../components/PowerSource"
import { Team, TeamID } from "../components/Team"
import { HexPosition } from "../components/HexPosition"

import { PowerSystem } from "../systems/PowerSystem"

import { List } from "immutable"

export interface ItemEvent {
    changer: GameStateChanger
};

export class ItemSystem extends System {
    /**
     * List of entities with items
     * @type {List<Entity>}
     */
    private _entities: List<Entity> = List<Entity>();

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);
    }
    /**
     * Handle a Items component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.ITEMS) {
            this._entities = this._entities.push(entity);
        }
    }
    /**
     * Handle a Items component being detached from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.ITEMS) {
            const index = this._entities.indexOf(entity);

            if (index >= 0) {
                this._entities = this._entities.delete(index);
            }
        }
    }
    /**
     * At the end of the turn, reduce cooldowns where appropriate
     */
    public processTurnEnd(state: GameStateChanger) {
        for (const entity of this._entities) {
            const team = state.state.getComponent<Team>(
                entity, ComponentType.TEAM);

            if (!team || team.data.team != state.state.current_team) continue;

            const items = state.state.getComponent<Items>(
                entity, ComponentType.ITEMS)!;

            for (const item of items.data.items) {
                if (item.cooldown.active) {
                    item.cooldown.remaining -= 1;

                    if (item.cooldown.remaining == 0) {
                        item.cooldown.active = false;
                    }
                }
            }

            const new_items_comp = items.with(items.data);
            state.makeChange(new UpdateComponent(new_items_comp));
        }
    }
    /**
     * Determine whether or not an entity can use an item
     *
     * @param  {Entity}         entity Entity to check
     * @param  {number}         index  Index of item to check
     * @return {boolean}               Whether or not the entity can use item
     */
    public itemUsable(entity: Entity, index: number): boolean {
        const items_comp = this._state.getComponent<Items>(
            entity, ComponentType.ITEMS);

        if (items_comp == undefined) {
            return false;
        } else if (items_comp.data.items.length <= index) {
            return false;
        }

        const item = items_comp.data.items[index];

        /* Check cooldown */
        if (item.cooldown.remaining > 0) {
            return false;
        }

        /* Check resource */
        const power_system = this._systems.lookup(PowerSystem);

        if (!power_system.hasEnough(entity, item.cost)) {
            return false;
        }

        /* Can only use items on active (on the grid) entities */
        const pos = this._state.getComponent<HexPosition>(
            entity, ComponentType.HEX_POSITION);

        if (pos == undefined) {
            return false;
        }

        return true;
    }
    /**
     * Attempt to use an item on an entity
     *
     * @param  {GameStateChanger} changer Game state changer
     * @param  {Entity}           entity  Entity using power
     * @param  {number}           index   Index of item to use
     * @param  {Vec2[]}           targets Targets
     * @return {boolean}                  Whether or not the item was used
     */
    public useItem(changer: GameStateChanger, entity: Entity, index: number,
                   targets: Vec2[]): boolean {
        if (!this.itemUsable(entity, index)) {
            return false;
        }
        const items_comp = this._state.getComponent<Items>(
            entity, ComponentType.ITEMS)!;
        const item = items_comp.data.items[index];

        /* First, charge for usage */
        const power_system = this._systems.lookup(PowerSystem);
        power_system.usePower(changer, entity, item.cost);

        /* Then, handle cooldown */
        item.cooldown.remaining = item.cooldown.value;

        if (item.cooldown.wait_for != undefined) {
            this._observer.items.addListener(item.cooldown.wait_for,
                (item_event: ItemEvent) => {
                /* Lookup the item again */
                const items_comp = this._state.getComponent<Items>(
                    entity, ComponentType.ITEMS)!;
                const item = items_comp.data.items[index];
                item.cooldown.active = true;
                const new_items = items_comp.with(items_comp.data);
                changer.makeChange(new UpdateComponent(new_items));
            });
        } else {
            item.cooldown.active = true;
        }

        /* Update state */
        const new_items = items_comp.with(items_comp.data);
        changer.makeChange(new UpdateComponent(new_items));

        /* Emit event */
        this._observer.items.emit(item.name, {
            changer: changer,
            entity: entity,
            index: index,
            targets: targets
        });

        return true;
    }
}
