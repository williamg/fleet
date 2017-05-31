/**
 * @file game/components/Deployable.ts
 * Component for a deployable entity
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export type DeployableData = {
    deploy_cost: number;
};

export type Deployable = ComponentImpl<DeployableData>;

export function newDeployable(id: ComponentID, data: DeployableData): Deployable {
    return new ComponentImpl(ComponentType.DEPLOYABLE, id, data);
}
