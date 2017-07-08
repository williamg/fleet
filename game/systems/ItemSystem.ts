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

import { Alliance, Items, Item, ItemsData } from "../components/Items"
import { PowerSource, PowerType } from "../components/PowerSource"
import { Team, TeamID } from "../components/Team"
import { HexPosition } from "../components/HexPosition"

import { PowerSystem } from "../systems/PowerSystem"
import { GridSystem } from "../systems/GridSystem"

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
     * @param  {Entity}  entity Entity to check
     * @param  {Item}    item   Item to check
     * @return {boolean}        Whether or not the entity can use item
     */
    public itemUsable(entity: Entity, item: Item): boolean {
        /* Check cooldown */
        if (item.cooldown.remaining > 0) {
            return false;
        }

        /* Check resource */
        const power_comp = this._state.getComponent<PowerSource>(
            entity, ComponentType.POWER_SOURCE)!;

        if (power_comp.data.current < item.cost) {
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
     * Validate a user's target selection
     *
     * @param  {Entity}  entity Entity using the item
     * @param  {Item}    item   Item being used
     * @param  {Vec2}    target Target to validate
     * @return {boolean}        Whether or not the target is valid
     */
    public isValidTarget(entity: Entity, item: Item, target: Vec2 | undefined):
        boolean {
        if (item.target == undefined){
            return target == undefined;
        } else if (target == undefined) {
            return false;
        }

        const grid_system = this._systems.lookup(GridSystem);
        const posc = this._state.getComponent<HexPosition>(
            entity, ComponentType.HEX_POSITION)!;
        const pos = new Vec2(posc.data.x, posc.data.y);

        /* First, make sure range is satisfied */
        if (grid_system.straightLineDistance(pos, target) > item.target.range) {
            return false;
        }

        if (item.target.entity == undefined) {
            return true;
        }

        /* Item requires an entity */
        const target_stat = grid_system.occupancyStatus(target);

        if (target_stat == "free" || target_stat == "unknown") {
            return false;
        }

        const entity_team = this._state.getComponent<Team>(
            entity, ComponentType.TEAM)!.data.team;
        const target_team = this._state.getComponent<Team>(
            target_stat, ComponentType.TEAM)!.data.team;

        switch (item.target.entity.team) {
            case Alliance.ANY: return true;
            case Alliance.FRIENDLY: return entity_team == target_team;
            case Alliance.ENEMY: return entity_team != target_team;
        }

    }
    /**
     * Attempt to use an item on an entity
     *
     * @param  {GameStateChanger} changer Game state changer
     * @param  {Entity}           entity  Entity using power
     * @param  {number}           index   Index of item to use
     * @param  {Vec2 | undefined} target  Target
     * @return {boolean}                  Whether or not the item was used
     */
    public useItem(changer: GameStateChanger, entity: Entity, index: number,
                   target: Vec2 | undefined): boolean {
        const items_comp = changer.state.getComponent<Items>(
            entity, ComponentType.ITEMS);

        if (items_comp == undefined || items_comp.data.items.length <= index) {
            return false;
        }

        const item = items_comp.data.items[index];

        if (!this.itemUsable(entity, item)) {
            return false;
        }

        if (!this.isValidTarget(entity, item, target)) {
            return false;
        }

        /* First, charge for usage */
        const power_system = this._systems.lookup(PowerSystem);
        power_system.incrementCharge(entity, -item.cost, changer);

        /* Handle cooldown */
        item.cooldown.remaining = item.cooldown.value;

        /* Update state */
        const new_items = items_comp.with(items_comp.data);
        changer.makeChange(new UpdateComponent(new_items));

        /* Emit event */
        this._observer.items.emit(item.name, {
            changer: changer,
            entity: entity,
            index: index,
            target: target
        });

        return true;
    }
    /**
     * Start the cooldown for an item
     *
     * @param {Entity}           entity  Entity with item
     * @param {number}           index   Index of item
     * @param {GameStateChanger} changer Game state changer
     */
    public startCooldown(entity: Entity, index: number,
                         changer: GameStateChanger): void {
        const items_comp = changer.state.getComponent<Items>(
            entity, ComponentType.ITEMS);

        if (items_comp == undefined || items_comp.data.items.length <= index) {
            return;
        }

        const item = items_comp.data.items[index];

        item.cooldown.active = true;

        const new_items = items_comp.with(items_comp.data);
        changer.makeChange(new UpdateComponent(new_items));
    }
}
