/**
 * @file game/Effect.ts
 */
import { GridEntity } from "./GridEntity"
import { Damage } from "./Damage"

/**
 * A status effect describes long-lasting effects like buffs
 */
export abstract class StatusEffect {
    constructor() {
    }

    /** TODO: Description, name, etc. */

    /**
     * Called when this effect is applied to a ship
     * @param {GridEntity} entity Entity that the effect is being applied to
     */
    abstract apply(entity: GridEntity): void;

    /**
     * Process the ending of a turn
     */
    abstract processTurnEnd(): void;
    /**
     * Whether or not this status effect is currently active
     * @return {boolean} Active or not
     */
    abstract isActive(): boolean;

    /* Status effects can also modify certain in-game interactions */

    /**
     * Modify damage received by the ship this effect is attached to
     * @param {Damage} damage Damage
     */
    modifyReceiveDamage(damage: Damage): void {}
    /**
     * Modify damage inflicted by the ship this effect is attached to
     * @param {Damage} damage Damage
     */
    modifyInflictDamage(damage: Damage): void {}
}
/**
 * Manages the effects applied to a ship
 */
export class EffectManager {
    private readonly entity: GridEntity;
    private active_effects: StatusEffect[];

    constructor(entity: GridEntity) {
        this.entity = entity;
        this.active_effects = [];
    }
    /**
     * Apply an effect to the ship
     * @param {StatusEffect} effect Effect to apply
     */
    apply(effect: StatusEffect): void {
        effect.apply(this.entity);

        if (!effect.isActive()) return;

        /* Add status effects to our active_effects list */

        /* TODO: This needs to be sorted according to some canonical order so
         * that interactions between effects are consistent
         */
        this.active_effects.push(effect);
    }
    /**
     * Remove any inactive effects, return remaining active effects
     * @return {StatusEffect[]} Currently active effects
     */
    activeEffects(): StatusEffect[] {
        this.active_effects = this.active_effects.filter(function(se) {
            return se.isActive();
        })

        return this.active_effects;
    }
    /**
     * Process a turn ending
     */
    processTurnEnd(): void {
        for (let effect of this.activeEffects()) {
            effect.processTurnEnd();
        }
    }
    /**
     * Modify damage received
     * @param  {Damage} damage Damage received
     */
    modifyReceiveDamage(damage: Damage) {
        for (let effect of this.activeEffects()) {
            effect.modifyReceiveDamage(damage);
        }

        return damage;
    }
    /**
     * Modify damage inflicted
     * @param  {Damage} damage Damage inflicted
     */
    modifyInflictDamage(damage: Damage) {
        for (let effect of this.activeEffects()) {
            effect.modifyInflictDamage(damage);
        }

        return damage;
    }
}
