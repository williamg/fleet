/**
 * @file game/systesm/items/Shockwave.ts
 * System for the Shockwave item
 *
 * Deals damage to all adjacent enemies
 */
import { System, SystemObserver, SystemRegistry, ItemEventData }
    from "../../System"

import { IDPool } from "../../IDPool"
import { GameState, GameStateChanger } from "../../GameState"
import { Component, ComponentID, ComponentType } from "../../Component"
import { GridSystem } from "../GridSystem"
import { Vec2 } from "../../Math"
import { Entity } from "../../Entity"
import { CombatSystem } from "../CombatSystem"

import { HexPosition } from "../../components/HexPosition"
import { Team, TeamID } from "../../components/Team"

export class Shockwave extends System {
    public static readonly EVENT = "shockwave";

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        /* Subscribe to shockwave event */
        observer.items.addListener(Shockwave.EVENT, this.handle.bind(this));
    }

    private handle(event: ItemEventData) {
        const entity = event.entity;
        const changer = event.changer;

        /* Get position */
        const posc = changer.state.getComponent<HexPosition>(
            entity, ComponentType.HEX_POSITION)!;
        const pos = new Vec2(posc.data.x, posc.data.y);

        /* Get team */
        const teamc = changer.state.getComponent<Team>(
            entity, ComponentType.TEAM)!;

        /* Get neighbors */
        const grid_system = this._systems.lookup(GridSystem);
        const neighbors = grid_system.neighbors(pos);

        /* FIXME: Typesafe way to avoid the cast? */
        const neighbor_enemies: Entity[] =
            neighbors.map((p) => {
                return grid_system.occupancyStatus(p);
            }).filter((s) => {
                if (s == "free" || s == "unknown") {
                    return false;
                }

                const neighbor_team = changer.state.getComponent<Team>(
                    s, ComponentType.TEAM)!;

                return neighbor_team.data.team != teamc.data.team;
            }) as Entity[];

        /* Do damage */
        const combat_system = this._systems.lookup(CombatSystem);

        for (const n of neighbor_enemies) {
            const result = combat_system.calculateAttackResult(entity, n);

            const damage = {
                attacker: entity,
                defender: n,
                attack_result: result,
                amount: 10
            };

            combat_system.doDamage(damage, changer);
        }
    }

}


