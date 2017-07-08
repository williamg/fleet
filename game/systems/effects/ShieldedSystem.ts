/**
 * @file game/systems/items/Shielded.ts
 * System for the Shielded effect
 *
 * Absorbs damage
 */
import { System, SystemObserver, SystemRegistry } from "../../System"
import { IDPool } from "../../IDPool"
import { GameState, GameStateChanger } from "../../GameState"
import { Component, ComponentID, ComponentType } from "../../Component"
import { AttachComponent, DetachComponent, UpdateComponent } from "../../Changes"
import { Entity } from "../../Entity"
import { effects } from "../../GameData"
import { clamp } from "../../Math"
import { Messenger } from "../../Messenger"
import { LOG, ASSERT } from "../../util"

import { HealthEvent, HealthSystem } from "../HealthSystem"

import { EffectsInfo } from "../../components/EffectsInfo"
import { Item } from "../../components/Items"
import { ShieldedEffect, newShieldedEffect }
    from "../../components/effects/Shielded"

export type ShieldedEvent = {
    entity: Entity,
    component: ComponentID
};

export class ShieldedSystem extends System {
    /**
     * Published when a shield is destroyed (when remaining amount becomes 0)
     */
    public readonly shieldDestroyed: Messenger<ShieldedEvent, void> =
        new Messenger<ShieldedEvent, void>();
    /**
     * Published when a shield is deactivated. This *will* get published
     * when a shield is destroyed, after the shield destroyed event
     */
    public readonly shieldDeactivated: Messenger<ShieldedEvent, void> =
        new Messenger<ShieldedEvent, void>();

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        /* Subscribe to absorb damage */
        systems.lookup (HealthSystem).preTakeDamage.subscribe(
            this.absorbDamage.bind(this), 100);
    }

    public create(maximum: number, entity: Entity, changer: GameStateChanger):
        void {
        const effects_info_comp = changer.state.getComponent<EffectsInfo>(
            entity, ComponentType.EFFECTS_INFO);

        if (!effects_info_comp) {
            LOG.ERROR("Attempt to add effect to entity without effect slots");
            return;
        }

        /* TODO: Handle what happens when a shield already exists */

        const shielded_comp = newShieldedEffect(this._id_pool.component(), {
            maximum: maximum,
            remaining: maximum
        });

        changer.makeChange(new AttachComponent(entity, shielded_comp));

        const shielded_info = {
            name: effects.shielded.name,
            description: effects.shielded.name,
            status: `${maximum}/${maximum} remaining`,
            component: shielded_comp.id
        };
        /**
         * DANGER WILL ROBINSON: We're actually modifying the underlying
         * object here which we should really avoid because if we then forget
         * to make an UpdateComponent, Bad Things can happen. If we could
         * replace arrays with immutable lists in components that would be ideal
         */
        effects_info_comp.data.effects.push(shielded_info);
        changer.makeChange(new UpdateComponent(effects_info_comp));
    }

    public deactivateShield (entity: Entity, changer: GameStateChanger): void {
        /* First verify we actually have a shield */
        const shielded_comp = this._state.getComponent<ShieldedEffect>(
            entity, ComponentType.EFFECT_SHIELDED);

        if (!shielded_comp) {
            LOG.WARN("Attempting to deactivate shield from entity without one");
            return;
        }

        const event = {
            entity: entity,
            component: shielded_comp.id
        };

        /* Let people know this shield was deactivated */
        this.shieldDeactivated.publish(event, undefined, entity, changer);

        /* Remove components */
        changer.makeChange(new DetachComponent(entity, shielded_comp));

        const effects_info_comp = changer.state.getComponent<EffectsInfo>(
            entity, ComponentType.EFFECTS_INFO);

        if (!effects_info_comp) {
            LOG.ERROR("My EffectsInfo component is gone!");
            return;
        }

        const idx = effects_info_comp.data.effects.findIndex((info) => {
            return info.name == effects.shielded.name;
        });

        if (idx < 0) {
            LOG.ERROR("Effect info doesn't exist...");
            return;
        }

        /**
         * DANGER WILL ROBINSON: We're actually modifying the underlying
         * object here which we should really avoid because if we then forget
         * to make an UpdateComponent, Bad Things can happen. If we could
         * replace arrays with immutable lists in components that would be ideal
         */
        effects_info_comp.data.effects.splice(idx, 1);
        changer.makeChange(new UpdateComponent(effects_info_comp));
    }

    private absorbDamage (msg: HealthEvent, amount: number,
                          changer: GameStateChanger): [number, boolean]
    {
        /* Check if this entity has a shield */
        const shielded_comp = this._state.getComponent<ShieldedEffect>(
            msg.entity, ComponentType.EFFECT_SHIELDED);

        if (!shielded_comp) {
            return [msg.amount, true];
        }

        /* Reduce the shield by the given amount */
        const old_remaining = shielded_comp.data.remaining;
        const new_remaining = Math.max(old_remaining + msg.amount, 0);

        const new_shielded_comp = shielded_comp.with ({
            remaining: new_remaining
        });
        changer.makeChange(new UpdateComponent(new_shielded_comp));

        /* Update status */
        const effects_info_comp = changer.state.getComponent<EffectsInfo>(
            msg.entity, ComponentType.EFFECTS_INFO)!;

        if (!effects_info_comp) {
            LOG.ERROR("My EffectsInfo component is gone!");
        }

        const idx = effects_info_comp.data.effects.findIndex((info) => {
            return info.name == effects.shielded.name;
        });

        if (idx < 0) {
            LOG.ERROR("Effect info doesn't exist...");
        }

        /**
         * DANGER WILL ROBINSON: We're actually modifying the underlying
         * object here which we should really avoid because if we then forget
         * to make an UpdateComponent, Bad Things can happen. If we could
         * replace arrays with immutable lists in components that would be ideal
         */
        effects_info_comp.data.effects[idx].status =
            `${new_remaining}/${shielded_comp.data.maximum} remaining`,
        changer.makeChange(new UpdateComponent(effects_info_comp));

        /* Check if the shield was destroyed */
        if (new_remaining == 0) {
            const event = {
                entity: msg.entity,
                component: shielded_comp.id
            };

            this.shieldDestroyed.publish(event, undefined, msg.entity, changer);
            this.deactivateShield(msg.entity, changer);
        }

        const damage_absorbed = old_remaining - new_remaining;
        const new_damage_amount = amount + (old_remaining - new_remaining);

        return [new_damage_amount, new_damage_amount < 0];
    }
}
