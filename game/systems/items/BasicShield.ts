/**
 * @file game/systems/items/BasicShield.ts
 * System for the BasicShield item
 *
 * Absorbs a moderate amount of damage for a few turns
 */
import { System, SystemObserver, SystemRegistry, ItemEventData }
    from "../../System"
import { IDPool } from "../../IDPool"
import { GameState, GameStateChanger } from "../../GameState"
import { Component, ComponentID, ComponentType } from "../../Component"
import { Entity } from "../../Entity"
import {  items } from "../../GameData"
import { LOG, ASSERT } from "../../util"

import { ItemSystem } from "../ItemSystem"
import { ShieldedSystem, ShieldedEvent } from "../effects/ShieldedSystem"

import { Item } from "../../components/Items"
import { Team } from "../../components/Team"
import { ShieldedEffect } from "../../components/effects/Shielded"

import { List } from "immutable"

export class BasicShield extends System {
    /**
     * List of entities that have used a shield and are waiting to start the
     * cooldown
     */
    private _waiting_entities: List<[ItemEventData, number]> =
        List<[ItemEventData, number]>();


    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        /* Subscribe to basic shield event */
        observer.items.addListener(items.basic_shield.name,
                                   this.handle.bind(this));

        /* Subscribe to shield deactivated events */
        this._systems.lookup(ShieldedSystem).shieldDeactivated.subscribe(
            this.startCooldownAfterShieldDeactivated.bind (this), 0);
    }

    /**
     * Create an Item to attach to an entity
     * @returns Item
     */
    public static create(): Item {
        return {
            name: items.basic_shield.name,
            description: items.basic_shield.description,
            cooldown: {
                value: items.basic_shield.cooldown,
                active: false,
                remaining: 0,
            },
            cost: items.basic_shield.cost,
            target: undefined
        };
    }
    /**
     * At the end of the turn, update the remaining durations
     */
    public processTurnEnd(changer: GameStateChanger) {
        const entitiesToDeactivate: Entity[] = [];

        /* Decrease duration all entities of this team by 1 */
        this._waiting_entities = this._waiting_entities.map ((data) => {
            const [item_event, remaining] = data;
            const entity = item_event.entity;

            const team = changer.state.getComponent<Team>(
                entity, ComponentType.TEAM);

            if (!team || team.data.team != changer.state.current_team) {
                return data;
            }

            if (remaining == 1) {
                entitiesToDeactivate.push(entity);
            }

            const updated: [ItemEventData, number] =
                [item_event, remaining - 1];

            return updated;
        });

        /* If an entity is expired, deactivate the shield */
        for (const entity of entitiesToDeactivate) {
            this._systems.lookup(ShieldedSystem).deactivateShield(
                entity, changer);
        }
    }
    /**
     * Handle the BasicShield item being used
     *
     * @param {ItemEventData} evet Item event data
     */
    private handle(event: ItemEventData): void {
        const entity = event.entity;
        const changer = event.changer;

        /* Create effect info component */
        this._systems.lookup(ShieldedSystem).create(
            items.basic_shield.maximum, entity, changer);

        this._waiting_entities = this._waiting_entities.push(
            [event, items.basic_shield.duration]);
    }
    /**
     * Handler for the shield deactivation event. Starts the cooldown and
     * removes the entity from the waiting entities list
     *
     * @param  {ShieldedEvent}    event   Shielded event
     * @param  {void}
     * @param  {GameStateChanger} changer Game state changer
     * @return {[void, boolean]}          Whether or not to propagate
     */
    private startCooldownAfterShieldDeactivated(
        event: ShieldedEvent, _: void, changer: GameStateChanger):
        [void, boolean] {

        const idx = this._waiting_entities.findIndex((data) => {
            const [item_event, delay] = data;
            return item_event.entity == event.entity;
        });

        /* If a shield is deactivated, then the item must not be on cooldown */
        ASSERT (idx >= 0);

        const [item_event, rem]: [ItemEventData, number] =
                this._waiting_entities.get(idx)!;
        this._waiting_entities = this._waiting_entities.remove(idx);

        this._systems.lookup(ItemSystem).startCooldown(
            item_event.entity, item_event.index, changer);

        return [_, true];
    }
}


