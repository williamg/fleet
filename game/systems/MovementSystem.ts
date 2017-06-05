/**
 * @file game/systems/MovementSystem.ts
 * Handle movement logic for entities
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { UpdateComponent, AttachComponent } from "../Changes"
import { Entity } from "../Entity"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { GameSystems } from "../GameSystems"
import { System } from "../System"
import { Messengers, OnMove, OnDeploy } from "../Messenger"
import { Vec2 } from "../Math"
import { ASSERT, LOG, Order, PriorityQueue } from "../util"

import { HexPosition } from "../components/HexPosition"
import { Moveable, newMoveable } from "../components/Moveable"
import { PowerSource } from "../components/PowerSource"

import { Map, Set } from "immutable"

export class MovementSystem extends System {
    /**
     * Initialize the system
     *
     * @param {IDPool}         id_pool    ID Pool
     * @param {Messengers}     messengers Messengers
     * @param {GameState}      state      Game state
     */
    constructor(id_pool: IDPool, messengers: Messengers, state: GameState) {
        super(id_pool, messengers, state);

        messengers.onDeploy.subscribe((deploy, changer) => {
            return this.onDeploy(deploy, changer);
        }, 0);
    }
    public onDeploy(deploy: OnDeploy, changer: GameStateChanger): boolean {
        /* When an entity is deployed, attach a movement component */
        const deployed = deploy.deployed;

        /* TODO: Lookup move cost somehow */
        const moveable = newMoveable(this._id_pool.component(), {
            move_cost: 20
        });

        changer.makeChange(new AttachComponent(deployed, moveable));
        return true;
    }
    /**
     * Attempt to move an entity to the given location
     *
     * @param  {GameStateChanger} changer   Game state changer
     * @param  {GameSystems}      systems   Game systems
     * @param  {Entity}           moving    The entity being moved
     * @param  {Vec2}             dest      The destination to move to
     * @return {boolean}                    Whether or not move was successful
     */
    public move(changer: GameStateChanger, systems: GameSystems,
                  moving: Entity, dest: Vec2): boolean {
        const valid_moves = this.getValidMoves(systems, moving);
        const dest_index = systems.grid.indexOf(dest);

        if (!valid_moves.has(dest_index)) {
            LOG.WARN("Received invalid action!");
            return false;
        }

        const cost = valid_moves.get(dest_index)!;

        systems.power.usePower(changer, moving, cost);
        const pos_comp = changer.state.getComponent<HexPosition>(
            moving, ComponentType.HEX_POSITION)!;

        const old_pos = new Vec2(pos_comp.data.x, pos_comp.data.y);
        const new_pos_comp = pos_comp.with({ x: dest.x, y: dest.y });

        changer.makeChange(new UpdateComponent(new_pos_comp));

        const moveData = {
            entity: moving,
            from: old_pos
        };

        this._messengers.onMove.publish(moveData, changer);
        return true;
    }
    /**
     * Get valid locations for this entity to move to
     *
     * Performs a BFS to find all nodes that are reachable without using more
     * than the entity's current power
     *
     * @param  {GameSystems}             systems Game systems
     * @param  {Entity}                  entity  Entity to get moves for
     * @return {Map<number, number>}             Map of reachable indices to
     *                                           their costs
     */
    public getValidMoves(systems: GameSystems, entity: Entity):
        Map<number, number> {
        /* Compute the maximum power we can use */
        const power_comp = this._state.getComponent<PowerSource>(
            entity, ComponentType.POWER_SOURCE);
        const max_power =
            (power_comp == undefined) ? Infinity : power_comp.data.current;
        const pos_comp = this._state.getComponent<HexPosition>(
            entity, ComponentType.HEX_POSITION)!;
        const starting_pos = new Vec2(pos_comp.data.x, pos_comp.data.y);

        /* Setup priority queue */
        type MoveData = { hex: Vec2, power_used: number };
        function comp(a: MoveData, b: MoveData): Order {
            if (a.power_used < b.power_used) return Order.LESS;
            if (a.power_used > b.power_used) return Order.GREATER;
            return Order.EQUAL;
        }

        const frontier = new PriorityQueue<MoveData>(comp);
        frontier.push({hex: starting_pos, power_used: 0});

        let reachable = Map<number, number>();

        while (frontier.size > 0) {
            const next = frontier.pop()!;

            /* The cheapest move uses more power than we have, we're done. */
            if (next.power_used > max_power) break;

            reachable = reachable.set(systems.grid.indexOf(next.hex),
                                      next.power_used);

            const cost_to_move = this.moveCostInHex(systems, entity, next.hex);
            const neighbors = systems.grid.neighbors(next.hex);

            for (const n of neighbors) {
                /* Only push if we haven't already reached it */
                if (reachable.has(systems.grid.indexOf(n))) continue;

                /* Can only move into free hexes */
                if (systems.grid.occupancyStatus(n) != "free") continue;

                frontier.push({
                    hex: n, power_used:
                    next.power_used + cost_to_move
                });
            }
        }

        return reachable;
    }
    /**
     * Get the move cost for an entity if it were in the given hex.
     * We may eventually have AOE effects that increase movement cost in certain
     * areas, which is the main point of making this function rather than just
     * checking move_cost.
     *
     * @param  {GameSystems} systems Game systems
     * @param  {Entity}      entity  The entity being moved
     * @param  {Vec2}        zone    The hex we're in
     * @return {number}             Move cost in this hex
     */
    private moveCostInHex(systems: GameSystems, entity: Entity, hex: Vec2):
        number {
        const moveable =
            this._state.getComponent<Moveable>(entity, ComponentType.MOVEABLE)!;

        return moveable.data.move_cost;
    }
}
