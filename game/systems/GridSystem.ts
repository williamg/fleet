/**
 * @file game/GridSystem.ts
 * Keeps track of the state of the grid for easy querying of neighbors/spatial
 * relationships
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { Entity } from "../Entity"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { System } from "../System"
import { Messengers, SubscriberID, OnMove } from "../Messenger"
import { Vec2 } from "../Math"
import { HexPosition } from "../components/HexPosition"
import { ASSERT, LOG } from "../util"

import { Map, List } from "immutable"

/**
 * Default map
 */
const MAP: [number, number][] = [
    [0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, -1], [-1, 1],
    [-2, 0], [0, 2], [2, 0], [0, -2], [1, 1], [-1, -1], [2, -1],
    [-2, 1], [1, -2], [-1, 2], [-2, 2], [2, -2], [3, 0], [-3, 0], [2, 1],
    [-2, -1],  [3, -3], [-3, 3], [4, -3], [-4, 1], [-3, 1], [-3, 2],
    [-4, 3], [4, -2], [-4, 2], [-2, 3],
    [3, -1], [3, -2], [2, -3], [4, -1]
];
/**
 * The status of a cell on the grid
 */
export type OccupancyStatus = Entity | "free" | "unknown"

export class GridSystem extends System {
    /**
     * Maps indexes to their respective coordinates
     * @type {List<[number, number]>}
     */
    private _index_map: List<Vec2>
    /**
     * Maps entities to their locations
     * @type {Map<Entity, [number, number]>}
     */
    private _entities: Map<Entity, Vec2> =
        Map<Entity, Vec2>();
    /**
     * Maps coordinate indexes to their occupancy status
     * @type {Map<number, OccupancyStatus>}
     */
    private _grid: Map<number, OccupancyStatus> =
        Map<number, OccupancyStatus>();
    /**
     * Subscriber ID for handling movement events
     * @type {SubscriberID}
     */
    private _on_move_sub: SubscriberID;

    /**
     * Initialize the grid with the provided cells
     *
     * @param {IDPool}             id_pool    ID Pool
     * @param {Messengers}         messengers Messengers
     * @param {GameState}          state      GameState
     * @param {[number, number][]} tiles      Map/tile coordinates
     */
    constructor(id_pool: IDPool, messengers: Messengers,
                state: GameState, tiles: [number, number][] = MAP) {
        super(id_pool, messengers, state);

        /* Initialize empty grid */
        this._index_map = List<Vec2>(tiles.map(([x, y]) => {
            return new Vec2(x, y);
        }));

        for (let i = 0; i < tiles.length; ++i) {
            this._grid = this._grid.set(i, "free");
        }

        /* Subscribe to movement event */
        this._on_move_sub =
            this._messengers.onMove.subscribe((evt, changer) => {
                this._updateGrid(changer.state, evt.entity);
                return true;
            }, 0);
    }
    /**
     * Grid getter
     */
    get grid(): Map<number, OccupancyStatus> {
        return this._grid;
    }
    get index_map(): List<Vec2> {
        return this._index_map;
    }
    public occupancyStatus(pos: Vec2): OccupancyStatus {
        const index = this._index_map.findIndex((loc) => {
            return pos.equals(loc);
        });

        if (index < 0) return "unknown";

        return this._grid.get(index)!;
    }
    public inBounds(pos: Vec2): boolean {
        return this._index_map.findIndex((loc) => {
            return pos.equals(loc);
        }) >= 0;
    }
    /**
     * Handle a HexPosition component being attached to an entity
     * @see System.componentAttached
     */
    public componentAttached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.HEX_POSITION) {
            this._updateGrid(state, entity);
        }
    }
    /**
     * Handle a HexPosition component being detached from an entity
     * @see System.componentDetached
     */
    public componentDetached(entity: Entity, comp: Component, state: GameState):
        void {
        if (comp.type == ComponentType.HEX_POSITION) {
            this._updateGrid(state, entity);
        }
    }
    /**
     * Update an entity's position on the grid
     *
     * @param {GameState} state  Current game state
     * @param {Entity}    entity Entity to update
     */
    private _updateGrid(state: GameState, entity: Entity):
        void {
        const oldloc = this._entities.get(entity);
        const pos = state.getComponent<HexPosition>(
            entity, ComponentType.HEX_POSITION);

        if (oldloc) {
            const oldi = this._index_map.findIndex((loc) => { 
                    return loc.equals(oldloc);
            });

            this._grid = this._grid.set(oldi, "free");
        }

        if (pos) {
            const newloc = new Vec2(pos.data.x, pos.data.y);

            const newi = this._index_map.findIndex((loc) => {
                return loc.equals(newloc);
            });

            this._entities = this._entities.set(entity, newloc);
            this._grid = this._grid.set(newi, entity);
        }

    }
}
