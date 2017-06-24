/**
 * @file game/systesm/items/Blaster.ts
 * System for the Blaster item
 *
 * Deals moderate damage to a nearby enemy
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
import { LOG, ASSERT } from "../../util"

import { HexPosition } from "../../components/HexPosition"
import { Team, TeamID } from "../../components/Team"
import { Item, Alliance, TargetFilter } from "../../components/Items"
import { Health } from "../../components/Health"

export class Blaster extends System {

    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        /* Subscribe to shockwave event */
        observer.items.addListener(items.blaster.name,
                                   this.handle.bind(this));
    }

    /**
     * Create an Item to attach to an entity
     * @returns Item
     */
    public static create(): Item {
        return {
            name: items.blaster.name,
            description: items.blaster.description,
            cooldown: {
                value: items.blaster.cooldown,
                active: false,
                remaining: 0,
                wait_for: undefined
            },
            cost: items.blaster.cost,
            target: {
                entity: {
                    team: Alliance.ENEMY
                },
                range: items.blaster.range
            }
        };
    }

    private handle(event: ItemEventData): void {
        const entity = event.entity;
        const changer = event.changer;

        /* Get position */
        const posc = changer.state.getComponent<HexPosition>(
            entity, ComponentType.HEX_POSITION)!;
        const pos = new Vec2(posc.data.x, posc.data.y);

        /* Get team */
        const teamc = changer.state.getComponent<Team>(
            entity, ComponentType.TEAM)!;

        /* Get target */
        ASSERT(event.target != undefined);

        const grid_system = this._systems.lookup(GridSystem);
        const target_ent = grid_system.occupancyStatus(event.target!);

        /* We've already validated targets, so this should never happen */
        if (target_ent == "free" || target_ent == "unknown")
        {
            LOG.WARN("Invalid Blaster target");
            ASSERT(false);
        }

        /* Do damage */
        const combat_system = this._systems.lookup(CombatSystem);
        const damage = {
            attacker: entity,
            defender: target_ent as Entity,
            amount: items.blaster.damage
        };

        combat_system.doDamage(damage, changer);
    }

}


