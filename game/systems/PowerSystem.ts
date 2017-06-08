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
import { ASSERT } from "../util"
import { clamp } from "../Math"
import { PowerSource, PowerType } from "../components/PowerSource"
import { Team, TeamID } from "../components/Team"

import { List } from "immutable"

export class PowerSystem extends System {
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
     * Determine whether or not an entity has enough power for an operation
     *
     * @param  {Entity}  entity Entity to check
     * @param  {number}  amount Amount of power necessary
     * @return {boolean}        Whether or not the entity has enough power
     */
    public hasEnough(entity: Entity, amount: number): boolean {
        if (amount <= 0) return true;

        const power_comp = this._state.getComponent<PowerSource>(
            entity, ComponentType.POWER_SOURCE);

        if (power_comp == undefined) {
            return false;
        }

        return power_comp.data.current >= amount;
    }
    /**
     * Use some power for the given entity. Before calling this, call
     * hasEnough(entity, number) to be sure this will succeed.
     *
     * @param {GameStateChanger} changer Game state changer
     * @param {Entity}           entity Entity using power
     * @param {number}           amount Amount of power to use
     */
    public usePower(changer: GameStateChanger, entity: Entity,
                    amount: number): void {
        ASSERT(this.hasEnough(entity, amount));

        const power_comp = this._state.getComponent<PowerSource>(
            entity, ComponentType.POWER_SOURCE)!;

        const new_power_comp = power_comp.with({
            current: power_comp.data.current - amount
        });

        changer.makeChange(new UpdateComponent(power_comp));
    }
}
