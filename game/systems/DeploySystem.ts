/**
 * @file game/systems/DeploySystem.ts
 * Keeps track of active deploy zones and handle the deployment of ships
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { DetachComponent, AttachComponent } from "../Changes"
import { Entity } from "../Entity"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { GameSystems } from "../GameSystems"
import { System } from "../System"
import { Messengers, OnDeploy } from "../Messenger"
import { Vec2 } from "../Math"
import { ASSERT, LOG } from "../util"

import { HexPosition, newHexPosition } from "../components/HexPosition"
import { Deployable } from "../components/Deployable"
import { DeployZone } from "../components/DeployZone"
import { Team } from "../components/Team"

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
     * @param {Messengers}     messengers Messengers
     * @param {GameState}      state      Game state
     */
    constructor(id_pool: IDPool, messengers: Messengers, state: GameState) {
        super(id_pool, messengers, state);

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
     * @param  {GameSystems}      systems   Game systems
     * @param  {Entity}           deploying The entity being deployed
     * @param  {Entity}           zone      The entity providing the destination
     *                                      zone
     * @param  {number}           index     The index within the zone
     * @return {boolean}                    Whether or not deploy was successful
     */
    public deploy(changer: GameStateChanger, systems: GameSystems,
                  deploying: Entity, zone: Entity, index: number): boolean {
        if (!this.zoneValidForEntity(systems, deploying, zone)) {
            return false;
        }

        if (!this.indexValidForZone(systems, zone, index)) {
            return false
        }

        const zone_comp = changer.state.getComponent<DeployZone>(
            zone, ComponentType.DEPLOY_ZONE)!;
        const deployable_comp = changer.state.getComponent<Deployable>(
            deploying, ComponentType.DEPLOYABLE)!;
        const zone_pos = changer.state.getComponent<HexPosition>(
            zone, ComponentType.HEX_POSITION)!;

        const pos_comp = newHexPosition(this._id_pool.component(), {
            x: zone_pos.data.x + zone_comp.data.targets[index].x,
            y: zone_pos.data.y + zone_comp.data.targets[index].y,
        });

        systems.power.usePower(changer, zone, deployable_comp.data.deploy_cost);
        changer.makeChange(new DetachComponent(deploying, deployable_comp));
        changer.makeChange(new AttachComponent(deploying, pos_comp));

        const deployData = {
            deployed: deploying,
            dest: zone,
            index: index
        };

        this._messengers.onDeploy.publish(deployData, changer);
        return true;
    }
    /**
     * Get valid deploy targets and zones for a particular entity
     *
     * @param  {GameSystems}             systems Game systems
     * @param  {Entity}                  entity  Entity to get targets for
     * @return {Set<[Entity, number[]]>}         Valid targets and indices
     */
    public getDeployTargets(systems: GameSystems, entity: Entity):
        Set<[Entity, number[]]> {
        let result = Set<[Entity, number[]]>();

        for (const deploy_zone of this._deploy_zones) {
            if (!this.zoneValidForEntity(systems, entity, deploy_zone)) {
                continue;
            }

            const zone_locs = this._state.getComponent<DeployZone>(
                deploy_zone, ComponentType.DEPLOY_ZONE)!;
            const valid_indices = [];

            for (let i = 0; i < zone_locs.data.targets.length; ++i) {
                if (!this.indexValidForZone(systems, deploy_zone, i)) {
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
     * @param  {GameSystems} systems Game systems
     * @param  {Entity}      entity  The entity being deployed
     * @param  {Entity}      zone    The entity providing a deploy zone
     * @return {boolean}             Whether or not the zone is valid
     */
    private zoneValidForEntity(systems: GameSystems, entity: Entity,
                               zone: Entity): boolean {
        const ent_team =
            this._state.getComponent<Team>(entity, ComponentType.TEAM)!;
        const zone_team =
            this._state.getComponent<Team>(zone, ComponentType.TEAM)!;

        /* Zone must be the same team */
        if (ent_team.data.team != zone_team.data.team) {
            return false;
        }

        const deployable = this._state.getComponent<Deployable>(
            entity, ComponentType.DEPLOYABLE)!;

        /* Zone must have enough power */
        if (!systems.power.hasEnough(zone, deployable.data.deploy_cost)) {
            return false;
        }

        return true;
    }
    /**
     * Determine if a given target index zone is valid for a given zone
     *
     * @param  {GameSystems} systems Game systems
     * @param  {Entity}      zone    The entity providing a deploy zone
     * @param  {number}      index   The target index to check
     * @return {boolean}             Whether or not the zone is valid
     */
    private indexValidForZone(systems: GameSystems, zone: Entity,
                              index: number): boolean {
        const zone_pos = this._state.getComponent<HexPosition>(zone,
            ComponentType.HEX_POSITION)!;
        const zone_locs = this._state.getComponent<DeployZone>(zone,
            ComponentType.DEPLOY_ZONE)!;
        const pos = new Vec2(zone_pos.data.x + zone_locs.data.targets[index].x,
                             zone_pos.data.y + zone_locs.data.targets[index].y);

        if (!systems.grid.inBounds(pos)) return false;
        if (systems.grid.occupancyStatus(pos) != "free") return false;

        return true;
    }
}
