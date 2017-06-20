/**
 * @file game/components/Health.ts
 * Component for the health of an entity. Once a unit's health reaches 0,
 * it is destroyed and no longer present in the game.
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export type HealthData = {
    capacity: number,
    current: number,
};

export type Health = ComponentImpl<HealthData>;

export function newHealth(id: ComponentID, data: HealthData): Health {
    return new ComponentImpl(ComponentType.HEALTH, id, data);
}
