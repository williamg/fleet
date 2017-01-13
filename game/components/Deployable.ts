/**
 * @file game/component/Deployable.ts
 */
import { Charge } from "./Charge"
import { DeployZone} from "./DeployZone"
import { Position, Movement } from "./Positioning"
import { Attribute } from "../Attribute"
import { Component } from "../Component"
import { Entity } from "../Entity"
import { Filter } from "../Filter"
import { Vec2 } from "../Math"
import { ChargeThreshold } from "../filters/ChargeThreshold"
import { HasComponent } from "../filters/HasComponent"
import { Matches } from "../filters/Matches"
import { ASSERT } from "../util"

/**
 * Deployable entities are not on the grid, but have the ability to be moved
 * onto the grid into designated DeployZones provided by specific entities.
 */
export class Deployable extends Component {
    deploy_cost: Attribute;

    constructor(entity: Entity, deploy_cost: number) {
        super(entity);

        this.deploy_cost = new Attribute(0, Infinity, deploy_cost);
    }
    /**
     * Get the valid targets that this entity can be deployed to
     * @return {Filter<Vec2>} Valid deployment locations
     */
    targetFilter(): Filter<Vec2> {
        const charge_filter = new ChargeThreshold(this.deploy_cost.value());
        const has_components = new HasComponent(DeployZone);
        const deploy_pad_filter = has_components.and(charge_filter);

        /* Get entities with deploy pads */
        const all_entities = [...Entity.all()];
        const deploy_pads = deploy_pad_filter.filter(all_entities);

        /* Extract from these the valid deploy targets */
        const deploy_targets = deploy_pads.map<Vec2[]>(function(entity) {
            const deploy_zone = entity.getComponent(DeployZone)!;
            ASSERT(deploy_zone != null);
            return deploy_zone.targets;
        }).reduce((acc, cur) => acc.concat(cur), []);

        /* Remove all occupied deploy targets */
        const available_deploy_targets = deploy_targets.filter((pos) => {
            return (this.entity.global_state.grid.at(pos) == null);
        });

        /* Return a filter */
        const comp = (a: Vec2, b: Vec2) => { return a.equals(b); }
        return new Matches(available_deploy_targets, comp);
    }
    /**
     * Attempt to deploy this entity to the target destination
     * @param  {Vec2}    dest Deployment location
     * @return {boolean}      Whether or not deployment was successful
     */
    deploy(dest: Vec2): boolean {
        const filter = this.targetFilter();

        if (!filter.matches(dest)) return false;

        this.entity.removeComponent(this);
        const charge = this.entity.getComponent(Charge)!;
        const pos = this.entity.addComponent(Position, this.entity, dest);
        this.entity.addComponent(Movement, this.entity, pos, charge,
                                 this.deploy_cost);

        /* Now we have to find the deploy pad to decrement its charge.
         * TODO: Figure out how to let this reuse this same computation from
         * targetFilter()
         */
        const charge_filter = new ChargeThreshold(this.deploy_cost.value());
        const has_components = new HasComponent(DeployZone);
        const deploy_pad_filter = has_components.and(charge_filter);

        /* Get entities with deploy pads */
        const all_entities = [...Entity.all()];
        const deploy_pads = deploy_pad_filter.filter(all_entities);
        let deploy_pad: Entity | null = null;

        for (let dp of deploy_pads) {
            const deploy_zone = dp.getComponent(DeployZone)!;
            ASSERT(deploy_zone != null);

            let target_found = false;

            for (let target of deploy_zone.targets) {
                if (target.equals(dest)) {
                    target_found = true;
                    break;
                }
            }

            if (target_found) {
                deploy_pad = dp;
                break;
            }
        }

        /* We know the deploy pad exists and meets our conditions since dest
         * passed the target filter
         */
        ASSERT(deploy_pad != null);
        const dp_charge = deploy_pad!.getComponent(Charge)!;
        ASSERT(dp_charge != null);

        dp_charge.current_charge -= this.deploy_cost.value();
        return true;
    }


}
