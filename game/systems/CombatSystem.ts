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
import { HealthSystem } from "./HealthSystem"
import { Health } from "../components/Health"

export type Damage = {
    readonly attacker: Entity,
    readonly defender: Entity,
    readonly amount: number
    readonly attack_result: AttackResult
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
     * Determine the attack result from the damage
     *
     * @param  {Entity}       attacker Attacking entity
     * @param  {Entity}       defender Defending entity
     * @return {AttackResult}        Attack result
     */
    public calculateAttackResult(attacker: Entity, defender: Entity):
        AttackResult {
            return AttackResult.HIT;
    }
    /**
     * Do some damage
     *
     * @param {Damage}           damage  Damage object to execute
     * @param {GameStateChanger} changer Game state changer
     */
    public doDamage(damage: Damage, changer: GameStateChanger): void {
        if (damage.attack_result == AttackResult.MISS) {
            return;
        }

        damage = this.applyAttackerBuffs(damage);
        damage = this.applyDefenderBuffs(damage);

        const health_comp = changer.state.getComponent<Health>(
            damage.defender, ComponentType.HEALTH);

        if (!health_comp) {
            return;
        }

        const health_system = this._systems.lookup(HealthSystem);
        health_system.incrementHealth(damage.defender, -damage.amount, changer);
    }
    /**
     * Apply buffs from the attacker to this damage object, producing a new
     * damage object
     *
     * @param  {Damage} damage Original damage object
     * @return {Damage}        Buffed damage object
     */
    public applyAttackerBuffs(damage: Damage): Damage {
        return damage;
    }

    /**
     * Apply buffs from the defneder to this damage object, producing a new
     * damage object
     *
     * @param  {Damage} damage Original damage object
     * @return {Damage}        Buffed damage object
     */
    public applyDefenderBuffs(damage: Damage): Damage {
        return damage;
    }
}
