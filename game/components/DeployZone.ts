/**
 * @file game/components/DeployZone
 */
import { Component } from "../Component"
import { Entity } from "../Entity"
import { Vec2 } from "../Math"

/**
 * Entities with this component provide a "zone" of grid locations to which
 * docked ships can be deployed.
 *
 * NOTE: Kinda weird that this doesn't require a Charge component even though
 * Deployable requires (and checks) that all DeployZone entities also have
 * Charge components. Smells funny.
 */
export class DeployZone extends Component {
    targets: Vec2[];

    constructor(entity: Entity, targets: Vec2[]) {
        super(entity);

        this.targets = targets;
    }
}
