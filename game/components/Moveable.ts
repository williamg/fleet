/**
 * @file game/components/Moveable.ts
 * Component for a moveable entity
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export type MoveableData = {
    move_cost: number;
};

export type Moveable = ComponentImpl<MoveableData>;

export function newMoveable(id: ComponentID, data: MoveableData): Moveable {
    return new ComponentImpl(ComponentType.MOVEABLE, id, data);
}
