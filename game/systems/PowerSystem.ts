/**
 * @file game/PowerSystem.ts
 * Processes power systems on entities
 */
import { System, SystemObserver, SystemRegistry } from "../System"
import { IDPool } from "../IDPool"
import { Entity } from "../Entity"
import { Component, ComponentType } from "../Component"
import { GameState, GameStateChanger } from "../GameState"
import { UpdateComponent } from "../Changes"
import { ASSERT, LOG } from "../util"
import { clamp } from "../Math"
import { Messenger } from "../Messenger"
import { PowerSource, PowerType } from "../components/PowerSource"
import { Team, TeamID } from "../components/Team"

import { List } from "immutable"

export type ChargeEvent = {
    entity: Entity,
    amount: number
};

export class PowerSystem extends System {
    /**
     * Power system messengers
     */
    public readonly preCharge: Messenger<ChargeEvent, number> =
        new Messenger<ChargeEvent, number>();
    public readonly postCharge: Messenger<ChargeEvent, undefined> =
        new Messenger<ChargeEvent, undefined>();
    public readonly preDischarge: Messenger<ChargeEvent, number> =
        new Messenger<ChargeEvent, number>();
    public readonly postDischarge: Messenger<ChargeEvent, undefined> =
        new Messenger<ChargeEvent, undefined>();
    /**
     * List of powered entities
     * @type {List<Entity>}
     */
    private _entities: List<Entity> = List<Entity>();

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);
    }
    /**
     * Handle a Deployable component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.POWER_SOURCE) {
            this._entities = this._entities.push(entity);
        }
    }
    /**
     * Handle a Deployable component being detached from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.POWER_SOURCE) {
            const index = this._entities.indexOf(entity);

            if (index >= 0) {
                this._entities = this._entities.delete(index);
            }
        }
    }
    /**
     * At the end of the turn, recharge batteries where appropriate
     */
    public processTurnEnd(state: GameStateChanger) {
        for (const entity of this._entities) {
            const team = state.state.getComponent<Team>(
                entity, ComponentType.TEAM);

            if (!team || team.data.team != state.state.current_team) continue;

            const power_comp = state.state.getComponent<PowerSource>(
                entity, ComponentType.POWER_SOURCE)!;

            /* Antimatter doesn't get recharged */
            if (power_comp.data.type == PowerType.ANTI_MATTER) {
                continue;
            }

            const new_val = clamp(
                power_comp.data.current + power_comp.data.recharge, 0,
                power_comp.data.capacity);


            const new_power_comp = power_comp.with({
                current: new_val
            });

            state.makeChange(new UpdateComponent(new_power_comp));
        }
    }
    /**
     * Increment a unit's power by a given amount
     *
     * @param {Entity}           entity Entity using power
     * @param {number}           amount Amount of power to use
     * @param {GameStateChanger} changer Game state changer
     */
    public incrementCharge (entity: Entity, amount: number,
                            changer: GameStateChanger): void {
        if (amount == 0) {
            return;
        }

        const power_comp = this._state.getComponent<PowerSource>(
            entity, ComponentType.POWER_SOURCE)!;
        let charge_event = {
            entity: entity,
            amount: amount
        };

        if (amount > 0) {
            const new_amount = this.preCharge.publish(
                charge_event, amount, entity, changer);

            if (new_amount < 0) {
                LOG.WARN("Messenger changed sign of charge amount");
                return;
            }

            charge_event.amount = new_amount;
        } else {
            const new_amount = this.preDischarge.publish(
                charge_event, amount, entity, changer);

            if (new_amount > 0) {
                LOG.WARN("Messenger changed sign of charge amount");
                return;
            }

            charge_event.amount = new_amount;
        }

        const new_charge =
            clamp(power_comp.data.current + charge_event.amount, 0,
                  power_comp.data.capacity);

        const new_power_comp = power_comp.with({
            current: new_charge
        });

        changer.makeChange(new UpdateComponent(power_comp));

        if (charge_event.amount > 0) {
            this.postCharge.publish(charge_event, undefined, entity, changer);
        } else {
            this.postDischarge.publish(
                charge_event, undefined, entity, changer);
        }
    }
}
