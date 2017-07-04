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
import { Messenger } from "../Messenger"
import { HealthSystem } from "./HealthSystem"
import { Health } from "../components/Health"
import { Pilot } from "../components/Pilot"
import { ASSERT } from "../util"

export type Damage = {
    attacker: Entity,
    defender: Entity,
    item_index: number,
    amount: number,
};

export enum AttackResult {
    HIT,
    CRIT,
    MISS
};

export type DamageResult = {
    damage: Damage;
    result: AttackResult;
};

export class CombatSystem extends System {
    /**
     * Combat messengers
     *
     * On an attack, the messengers are invoked in the following order:
     *
     *     1. preAttack
     *     2. decideResult
     *     3. pre<Result>
     *     4. <Entities modified>
     *     5. post<Result>
     *     6. postAttack
     */
    /*
     * Used to apply any generic buffs/debuffs that apply universally 
     * (i.e. aren't conditional to the result type)
     */
    public readonly preAttack: Messenger<undefined, Damage> =
        new Messenger<undefined, Damage>();
    /*
     * Used to modify the result of an attack
     */
    public readonly decideResult: Messenger<Damage, AttackResult> =
        new Messenger<Damage, AttackResult>();
    /**
     * Once the result has been decided, these messengers can modify the damage
     * done, but not the type
     */
    public readonly preCrit: Messenger<undefined, Damage> =
        new Messenger<undefined, Damage>();
    public readonly preHit: Messenger<undefined, Damage> =
        new Messenger<undefined, Damage>();
    public readonly preDodge: Messenger<undefined, Damage> =
        new Messenger<undefined, Damage>();
    /**
     * Post events can't modify anything
     */
    public readonly postCrit: Messenger<DamageResult, undefined> =
        new Messenger<DamageResult, undefined>();
    public readonly postHit: Messenger<DamageResult, undefined> =
        new Messenger<DamageResult, undefined>();
    public readonly postDodge: Messenger<DamageResult, undefined> =
        new Messenger<DamageResult, undefined>();
    public readonly postAttack: Messenger<DamageResult, undefined> =
        new Messenger<DamageResult, undefined>();

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);
    }

    /**
     * Do some damage
     *
     * @param {Damage}                  damage  Damage object to execute
     * @param {GameStateChanger}        changer Game state changer
     */
    public doDamage(damage: Damage, changer: GameStateChanger): void {
        const source = damage.attacker;

        damage = this.preAttack.publish(undefined, damage, source, changer);

        let result = this.calculateAttackResult(damage);
        result = this.decideResult.publish(damage, result, source, changer);

        if (result == AttackResult.MISS) {
            damage = this.preDodge.publish(undefined, damage, source, changer);
        } else {
            if (result == AttackResult.CRIT) {
                const crit = this.calculateCrit(damage);

                damage = {
                    ...damage,
                    amount: crit,
                };
                const att_pilot = this._state.getComponent<Pilot>(
                    damage.attacker, ComponentType.PILOT);

                damage = this.preCrit.publish(
                    undefined, damage, source, changer);
            } else {
                ASSERT(result == AttackResult.HIT);
                damage = this.preHit.publish(
                    undefined, damage, source, changer);
            }

            const health_system = this._systems.lookup(HealthSystem);
            health_system.incrementHealth(
                damage.defender, -damage.amount, changer);
        }

        const damage_result = {
            damage: damage,
            result: result
        };

        switch (result) {
            case AttackResult.MISS:
                this.postDodge.publish(damage_result, undefined, source,
                                       changer);
                break;
            case AttackResult.CRIT:
                this.postCrit.publish(damage_result, undefined, source,
                                      changer);
                break;
            case AttackResult.HIT:
                this.postHit.publish(damage_result, undefined, source, changer);
                break;
        }

        this.postAttack.publish(damage_result, undefined, source, changer);
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
    /**
     * Calculate the crit damage
     *
     * @param  {Damage} damage Damage
     * @return {number}        Crit damage
     */
    private calculateCrit(damage: Damage): number {
        const att_pilot = this._state.getComponent<Pilot>(
            damage.attacker, ComponentType.PILOT);
        let crit = damage.amount;

        if (att_pilot) {
            /* Get the range for the additional multiplier from the pilot */
            const range = constants.max_crit_multiplier -
                          constants.base_crit_multiplier;
            /* Determine the crit damage multiplier */
            const crit_multiplier = constants.base_crit_multiplier +
                range * (att_pilot.data.accuracy / constants.max_accuracy);
            /* Calculate the new critified damage */
            crit = Math.floor(crit * crit_multiplier);
        }

        return crit;
    }
}
