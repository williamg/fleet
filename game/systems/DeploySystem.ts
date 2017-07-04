/**
 * @file game/systems/DeploySystem.ts
 * Keeps track of active deploy zones and handle the deployment of ships
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { DetachComponent, AttachComponent } from "../Changes"
import { Entity } from "../Entity"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { System, SystemRegistry, SystemObserver, DeployEvent } from "../System"
import { Vec2 } from "../Math"
import { ASSERT, LOG } from "../util"

import { HexPosition, newHexPosition } from "../components/HexPosition"
import { Deployable } from "../components/Deployable"
import { DeployZone } from "../components/DeployZone"
import { PowerSource } from "../components/PowerSource"
import { Team } from "../components/Team"

import { PowerSystem } from "./PowerSystem"
import { GridSystem } from "./GridSystem"

import { Set } from "immutable"

export class DeploySystem extends System {
    /**
     * Keeps track of entities that provide deploy zones
     * @type {Set<Entity>}
     */
    private _deploy_zones: Set<Entity>;
    /**
     * Initialize the system
     *
     * @param {IDPool}         id_pool    ID Pool
     * @param {SystemObserver} observer   Observer
     * @param {SystemRegistry} systems    Systems registry
     * @param {GameState}      state      Game state
     */
    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        this._deploy_zones = Set<Entity>();
    }
    /**
     * Handle a DeployZone component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.DEPLOY_ZONE){
            this._deploy_zones = this._deploy_zones.add(entity);
        }
    }
    /**
     * Handle a DeployZone component being removed from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.DEPLOY_ZONE){
            this._deploy_zones = this._deploy_zones.add(entity);
        }
    }
    /**
     * Attempt to deploy an entity to the location at the given index in the
     * given zone
     *
     * @param  {GameStateChanger} changer   Game state changer
     * @param  {Entity}           deploying The entity being deployed
     * @param  {Entity}           zone      The entity providing the destination
     *                                      zone
     * @param  {number}           index     The index within the zone
     * @return {boolean}                    Whether or not deploy was successful
     */
    public deploy(changer: GameStateChanger, deploying: Entity, zone: Entity,
                  index: number): boolean {
        if (!this.zoneValidForEntity(deploying, zone)) {
            return false;
        }

        if (!this.indexValidForZone(zone, index)) {
            return false
        }


        const deployable_comp = changer.state.getComponent<Deployable>(
            deploying, ComponentType.DEPLOYABLE)!;
        const zone_comp = changer.state.getComponent<DeployZone>(
            zone, ComponentType.DEPLOY_ZONE)!;
        const zone_pos = changer.state.getComponent<HexPosition>(
            zone, ComponentType.HEX_POSITION)!;

        const pos_comp = newHexPosition(this._id_pool.component(), {
            x: zone_pos.data.x + zone_comp.data.targets[index].x,
            y: zone_pos.data.y + zone_comp.data.targets[index].y,
        });

        const power_system = this._systems.lookup(PowerSystem);

        power_system.incrementCharge(
            zone, -deployable_comp.data.deploy_cost, changer);
        changer.makeChange(new DetachComponent(deploying, deployable_comp));
        changer.makeChange(new AttachComponent(deploying, pos_comp));

        const deployEvent: DeployEvent = {
            changer: changer,
            deployed: deploying,
            dest: zone,
            index: index
        };

        this._observer.general.emit("deploy", deployEvent);
        return true;
    }
    /**
     * Get valid deploy targets and zones for a particular entity
     *
     * @param  {Entity}                  entity  Entity to get targets for
     * @return {Set<[Entity, number[]]>}         Valid targets and indices
     */
    public getDeployTargets(entity: Entity):
        Set<[Entity, number[]]> {
        let result = Set<[Entity, number[]]>();

        for (const deploy_zone of this._deploy_zones) {
            if (!this.zoneValidForEntity(entity, deploy_zone)) {
                continue;
            }

            const zone_locs = this._state.getComponent<DeployZone>(
                deploy_zone, ComponentType.DEPLOY_ZONE)!;
            const valid_indices = [];

            for (let i = 0; i < zone_locs.data.targets.length; ++i) {
                if (!this.indexValidForZone(deploy_zone, i)) {
                    continue;
                }

                valid_indices.push(i);
            }

            if (valid_indices.length > 0) {
                result = result.add([deploy_zone, valid_indices]);
            }
        }

        return result;
    }
    /**
     * Determine if a given deploy zone is valid for a given entity
     *
     * @param  {Entity}         entity  The entity being deployed
     * @param  {Entity}         zone    The entity providing a deploy zone
     * @return {boolean}                Whether or not the zone is valid
     */
    private zoneValidForEntity(entity: Entity, zone: Entity): boolean {
        /* Zone must be the same team */
        const ent_team =
            this._state.getComponent<Team>(entity, ComponentType.TEAM)!;
        const zone_team =
            this._state.getComponent<Team>(zone, ComponentType.TEAM)!;

        if (ent_team.data.team != zone_team.data.team) {
            return false;
        }

        /* Zone must have enough power */
        const deployable_comp = this._state.getComponent<Deployable>(
            entity, ComponentType.DEPLOYABLE)!;
        const power_comp = this._state.getComponent<PowerSource>(
            zone, ComponentType.POWER_SOURCE)!;

        if (deployable_comp.data.deploy_cost > power_comp.data.current) {
            return false;
        }

        return true;
    }
    /**
     * Determine if a given target index zone is valid for a given zone
     *
     * @param  {Entity}         zone    The entity providing a deploy zone
     * @param  {number}         index   The target index to check
     * @return {boolean}                Whether or not the zone is valid
     */
    private indexValidForZone(zone: Entity, index: number): boolean {
        const zone_pos = this._state.getComponent<HexPosition>(zone,
            ComponentType.HEX_POSITION)!;
        const zone_locs = this._state.getComponent<DeployZone>(zone,
            ComponentType.DEPLOY_ZONE)!;
        const pos = new Vec2(zone_pos.data.x + zone_locs.data.targets[index].x,
                             zone_pos.data.y + zone_locs.data.targets[index].y);
        const grid_system = this._systems.lookup(GridSystem);

        if (!grid_system.inBounds(pos)) return false;
        if (grid_system.occupancyStatus(pos) != "free") return false;

        return true;
    }
}
