/**
 * @file game/systems/DeploySystem.ts
 * Keeps track of active deploy zones and handle the deployment of ships
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { Entity } from "../Entity"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { System } from "../System"
import { Messengers, SubscriberID, BeforeDeploy } from "../Messenger"
import { Vec2 } from "../Math"
import { HexPosition } from "../components/HexPosition"
import { Deployable } from "../components/Deployable"
import { DeployZone } from "../components/DeployZone"
import { Team } from "../components/Team"
import { ASSERT, LOG } from "../util"

import { Set } from "immutable"

export class DeploySystem extends System {
    /**
     * Keeps track of entities that provide deploy zones
     * @type {SetEntity>}
     */
    private _deploy_zones: Set<Entity>;
    /**
     * Subscriber ID for handling deploy events
     * @type {SubscriberID}
     */
    private _before_deploy_sub: SubscriberID;

    /**
     * Initialize the system
     *
     * @param {IDPool}     id_pool    ID Pool
     * @param {Messengers} messengers Messengers
     * @param {GameState}  state      Game state
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
     * Get valid deploy targets for a particular entity
     *
     * @param  {Entity}      entity Entity to get targets for
     * @return {Set<Entity>}        Valid targets
     */
    public targetsFor(entity: Entity): Set<Entity> {
        const ent_team =
                this._state.getComponent<Team>(entity, ComponentType.TEAM)!;

        return this._deploy_zones.filter((zone: Entity) => {
            const zone_team =
                this._state.getComponent<Team>(zone, ComponentType.TEAM)!;

            return ent_team.data.team == zone_team.data.team;
        });
    }
}
