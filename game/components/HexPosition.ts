/**
 * @file game/components/HexPosition.ts
 * Components for entities that occupy a grid cell
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export type HexPositionData = {
    x: number,
    y: number
};

export type HexPosition = ComponentImpl<HexPositionData>;

const defaults: HexPositionData = {
    x: 0,
    y: 0
};

export function newHexPosition(id: ComponentID,
                               data: HexPositionData = defaults): HexPosition {
    return new ComponentImpl(ComponentType.HEX_POSITION, id, data);
}
