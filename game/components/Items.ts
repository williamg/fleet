/**
 * @file game/components/Items.ts
 * Componet for usable items on a unit
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"
import { TeamID } from "./Team"

export type TargetFilter = {
    entity: {
        team: TeamID | undefined
    } | undefined,
    range: number
};

export type Item = {
    name: string,
    description: string,
    cooldown: {
        value: number,
        active: boolean,
        remaining: number,
        wait_for: string | undefined
    },
    cost: number,
    event: string,
    targets: TargetFilter[],
}


export type ItemsData = {
    items: Item[]
};

export type Items = ComponentImpl<ItemsData>;

export function newItems(id: ComponentID, data: ItemsData): Items {
    return new ComponentImpl(ComponentType.ITEMS, id, data);
}
