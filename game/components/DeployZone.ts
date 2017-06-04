/**
 * @file game/components/DeployZone.ts
 * Component for an entity that provides a deploy zone
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"
import { Vec2 } from "../Math"

export type DeployZoneData = {
    targets: { x: number, y: number }[];
};

export type DeployZone = ComponentImpl<DeployZoneData>;

export function newDeployZone(id: ComponentID, data: DeployZoneData): DeployZone {
    return new ComponentImpl(ComponentType.DEPLOY_ZONE, id, data);
}
