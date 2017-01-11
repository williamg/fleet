import { Entity, EntityID, System, Component } from "../Entity"
import { Charge, HexPosition, DeployZone, Team, Size } from "../components/Components"
import { Vec2 } from "../Math"

export class DeploymentSystem extends System {
    constructor() {
        super();
    }

    processTurnEnd(player: PlayerID) {};

    deploy(entity_id: EntityID, dest: Vec2): boolean {
        // First validate entity to be deployed
        const deployed = Entity.getEntity(entity_id);

        if (deployed == null) return false;

        /* If it is already on the grid, we can't deploy it
         * TODO: Add Deployable Component?
        */
        if (deployed.getComponent(HexPosition) != null) return false;

        const deployed_size = deployed.getComponent(Size);

        if (deployed_size == null) return false;

        /* Now find the DeployPad (if any) associated with our destination */
        const deploy_pad = (function() {
            for (let entity of Entity.all()) {
                const zone = entity.getComponent(DeployZone);

                if (zone == null) continue;

                for (let target of zone.targets) {
                    if (target.equals(dest)) return entity;
                }
            }

            return null;
        })();

        if (deploy_pad == null) return false;

        const zonecomp = deploy_pad.getComponent(DeployZone);
        const chargecomp = deploy_pad.getComponent(Charge);

        if (zonecomp == null || chargecomp == null) return false;

        const cost = zonecomp.cost_per_size * deployed_size.size;

        if (chargecomp.current_charge < cost) return false;

        /* Gross expensive check to see if any entity is at dest */
        for (let entity of Entity.all()) {
            const pos = entity.getComponent(HexPosition);

            if (pos == null) continue;

            if (pos.position.equals(dest)) return false;
        }

        /* All good, do it */
        deployed.addComponent<HexPosition>(HexPosition, entity_id, dest);
        chargecomp.current_charge -= cost;
        return true;
    }
}
