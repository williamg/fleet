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
import { items } from "../../GameData"

import { HexPosition } from "../../components/HexPosition"
import { Team, TeamID } from "../../components/Team"
import { Item, TargetFilter } from "../../components/Items"
import { Health } from "../../components/Health"

export class Shockwave extends System {
    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        /* Subscribe to shockwave event */
        observer.items.addListener(items.shockwave.name,
                                   this.handle.bind(this));
    }

    /**
     * Create an Item to attach to an entity
     * @returns Item
     */
    public static create(): Item {
        return {
            name: items.shockwave.name,
            description: items.shockwave.description,
            cooldown: {
                value: items.shockwave.cooldown,
                active: false,
                remaining: 0,
                wait_for: undefined
            },
            cost: items.shockwave.cost,
            targets: []
        };
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
                const health = changer.state.getComponent<Health>(
                    s, ComponentType.HEALTH);

                return health != undefined &&
                       neighbor_team.data.team != teamc.data.team;
            }) as Entity[];

        /* Do damage */
        const combat_system = this._systems.lookup(CombatSystem);

        for (const n of neighbor_enemies) {
            const damage = {
                attacker: entity,
                defender: n,
                amount: items.shockwave.damage
            };

            combat_system.doDamage(damage, changer);
        }
    }

}


