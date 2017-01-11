/**
 * @file game/systems/ItemSystem.ts
 */

import { Entity, EntityID, Component, System } from "../Entity"
import { HexPosition, Pilot, Movement, Team, Cooldown, ItemInfo, ItemEffect, PartialFilter, TargetFilter, Charge } from "../Components"
import { PlayerID } from "../Player"
import { hexDist } from "../Math"

function matches(entity: Entity, filter: PartialFilter): boolean {
    if (filter.one_of) {
        if (filter.one_of.indexOf(entity.id) == -1) return false;
    }

    if (filter.on_team) {
        const team = entity.getComponent(Team);

        if (team == null || team.team != filter.on_team) return false;
    }

    if (filter.in_range_of_entity) {
        const this_position = entity.getComponent(HexPosition);

        if (this_position == null) return false;

        const [id, range] = filter.in_range_of_entity;
        const other = Entity.getEntity(id);

        if (other == null) return false;

        const other_position = other.getComponent(HexPosition);

        if (other_position == null) return false;

        const dist = hexDist(other_position.position, this_position.position);
        if (range < dist) return false;
    }

    if (filter.has_attributes) {
        for (let attribute of filter.has_attributes) {
            switch(attribute) {
                case "move_cost":
                    if (entity.getComponent(Movement) == null) return false;
                    break;
                case "recharge":
                    if (entity.getComponent(Charge) == null) return false;
                    break;
                case "evasion":
                case "precision":
                case "accuracy":
                    if (entity.getComponent(Pilot) == null) return false;
                    break;
            }
        }
    }

    return true;
}

function findMatching(filter: PartialFilter): Entity[] {
    const entities: Entity[] = [];

    for (let entity of Entity.all()) {
        if (matches(entity, filter)) {
            entities.push(entity);
        }
    }

    return entities;
}

function applyEffect(entity: Entity, effect: ItemEffect): void {
    let remove
}

export class ItemSystem extends System {
    constructor() {
        super();
    }

    processTurnEnd(player: PlayerID) {
        /* Process cooldowns on all components */
        for (let entity of Entity.all()) {
            const cdcomp = entity.getComponent(Cooldown);

            if (cdcomp == null) continue;

            const team = entity.getComponent(Team);

            if (team == null) continue;
            if (team.team != player) continue;

            cdcomp.remaining--;

            if (cdcomp.remaining == 0) {
                entity.removeComponent(cdcomp);
            }
        }
    }

    useItem(entity_id: EntityID, target_id: EntityID): boolean {
        const item = Entity.getEntity(entity_id);

        if (item == null) return false;

        const target = Entity.getEntity(target_id);

        if (target == null) return false;

        if (item.getComponent(Cooldown) != null) return false;

        const info = item.getComponent(ItemInfo);

        if (info == null) return false;

        const ship = Entity.getEntity(info.ship);

        if (ship == null) return false;

        const charge = ship.getComponent(Charge);

        if (charge == null) return false;

        if (info.cost > charge.current_charge) return false;

        const targetFilter = item.getComponent(TargetFilter);

        if (targetFilter) {
            if (!matches(target, targetFilter)) return false;
        }

        const effects = item.getComponents(ItemEffect);

        for (let effect of effects) {
            effect.apply(target);
        }

        charge.current_charge -= info.cost;
        item.addComponent(Cooldown, item, info.cooldown);
        return true;
    }
}
