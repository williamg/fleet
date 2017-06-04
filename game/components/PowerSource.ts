/**
 * @file game/components/PowerSource.ts
 * Component for a power source for an entity. This is one of the two primary
 * resources in the game. Power is used to move, use items, and deploy. There
 * are 3 different types of power sources that have different characteristics
 * and effects (see PowerSystem.ts for more info)
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export enum PowerType {
    ANTI_MATTER,
    SOLAR,
    GENESIUM
};

export type PowerSourceData = {
    type: PowerType;
    capacity: number,
    current: number,
    recharge: number,
};

export type PowerSource = ComponentImpl<PowerSourceData>;

export function newPowerSource(id: ComponentID, data: PowerSourceData): PowerSource {
    return new ComponentImpl(ComponentType.POWER_SOURCE, id, data);
}
