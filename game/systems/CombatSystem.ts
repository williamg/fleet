/**
 * @file game/systems/CombatSystem.ts
 * Handles all combat in the game including:
 *
 *      - Calculating whether or not damage hits/crits
 *      - Calculating how much true damage is done (factoring in
 *        defenses/effects/etc.)
 *      - Change entities' health in resposne to damage
 *      - Removing entities that are destroyed
 */
import { System, SystemObserver, SystemRegistry } from "../System"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { Component, ComponentID, ComponentType } from "../Component"
import { Entity } from "../Entity"
import { constants } from "../GameData"
import { HealthSystem } from "./HealthSystem"
import { Health } from "../components/Health"
import { Pilot } from "../components/Pilot"

export type Damage = {
    readonly attacker: Entity,
    readonly defender: Entity,
    readonly amount: number
};

export enum AttackResult {
    HIT,
    CRIT,
    MISS
};

export class CombatSystem extends System {

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);
    }

    /**
     * Do some damage
     *
     * @param {Damage}                  damage  Damage object to execute
     * @param {GameStateChanger}        changer Game state changer
     * @returns {[Damage, AttackResult]}        The final damage and attack
     *                                          result
     */
    public doDamage(damage: Damage, changer: GameStateChanger):
         [Damage, AttackResult] | undefined {
        const result = this.calculateAttackResult(damage);

        if (result == AttackResult.MISS) {
            return [damage, result];
        }

        if (result == AttackResult.CRIT) {
            const att_pilot = this._state.getComponent<Pilot>(
                damage.attacker, ComponentType.PILOT);

            if (att_pilot) {
                /* Get the range for the additional multiplier from the pilot */
                const range = constants.max_crit_multiplier -
                              constants.base_crit_multiplier;
                /* Determine the crit damage multiplier */
                const crit_multiplier = constants.base_crit_multiplier +
                    range * (att_pilot.data.accuracy / constants.max_accuracy);
                /* Calculate the new critified damage */
                const new_amount = Math.floor(damage.amount * crit_multiplier);

                /* Create a new damage object */
                damage = {
                    ...damage,
                    amount: new_amount
                };
            }
        }

        damage = this.applyAttackerBuffs(damage);
        damage = this.applyDefenderBuffs(damage);

        const health_comp = changer.state.getComponent<Health>(
            damage.defender, ComponentType.HEALTH)!;

        const health_system = this._systems.lookup(HealthSystem);
        health_system.incrementHealth(damage.defender, -damage.amount, changer);

        return [damage, result];
    }
    /**
     * Apply buffs from the attacker to this damage object, producing a new
     * damage object
     *
     * @param  {Damage} damage Original damage object
     * @return {Damage}        Buffed damage object
     */
    private applyAttackerBuffs(damage: Damage): Damage {
        return damage;
    }

    /**
     * Apply buffs from the defneder to this damage object, producing a new
     * damage object
     *
     * @param  {Damage} damage Original damage object
     * @return {Damage}        Buffed damage object
     */
    private applyDefenderBuffs(damage: Damage): Damage {
        return damage;
    }
    /**
     * Determine the attack result from the damage
     *
     * @param  {Damage}       damage Damage
     * @return {AttackResult}        Attack result
     */
    private calculateAttackResult(damage: Damage): AttackResult {
        const att_pilot = this._state.getComponent<Pilot>(
            damage.attacker, ComponentType.PILOT);
        const def_pilot = this._state.getComponent<Pilot>(
            damage.defender, ComponentType.PILOT);

        let dodge_chance = 0.0;

        if (def_pilot) {
            dodge_chance += 0.5 * (def_pilot.data.evasion / 10);
        }

        if (Math.random() <= dodge_chance) {
            return AttackResult.MISS;
        }

        /* It definitely hits. Does it crit? */
        let crit_chance = 0.1;

        if (att_pilot) {
            crit_chance += 0.65 * (att_pilot.data.precision / 10);
        }

        if (Math.random() <= crit_chance) {
            return AttackResult.CRIT;
        }

        return AttackResult.HIT;
    }
}
