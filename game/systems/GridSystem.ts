/**
 * @file game/GridSystem.ts
 * Keeps track of the state of the grid for easy querying of neighbors/spatial
 * relationships
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { Entity } from "../Entity"
import { IDPool } from "../IDPool"
import { GameState, GameStateChanger } from "../GameState"
import { System, SystemObserver, SystemRegistry } from "../System"
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
    [3, -1], [3, -2], [2, -3], [4, -1],
    [4, 0], [3, 1], [-4, 0], [-3, -1], [2, 2], [-2, -2], [1, 2], [-1, -2],
    [0, 3], [0, -3], [1, -3], [-1, 3], [-2, 4], [2, -4], [-3, 4], [3, -4],
    [4, -4], [-4, 4], [-5, 1], [5, -1], [-5, 2], [5, -2], [5, -3], [-5, 3],
    [5, -4], [-5, 4]
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
     * Initialize the grid with the provided cells
     *
     * @param {IDPool}         id_pool    ID Pool
     * @param {SystemObserver} observer   System observer
     * @param {SystemRegistry} systems    System registry
     * @param {GameState}      state      GameState
     */
    constructor(id_pool: IDPool, observer: SystemObserver,
                systems: SystemRegistry, state: GameState) {
        super(id_pool, observer, systems, state);

        /* Initialize empty grid */
        this._index_map = List<Vec2>(MAP.map(([x, y]) => {
            return new Vec2(x, y);
        }));

        for (let i = 0; i < MAP.length; ++i) {
            this._grid = this._grid.set(i, "free");
        }
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
    public indexOf(pos: Vec2): number {
        ASSERT(this.inBounds(pos));

        return this._index_map.findIndex((loc) => {
            return pos.equals(loc);
        });
    }
    public occupancyStatus(pos: Vec2): OccupancyStatus {
        ASSERT(this.inBounds(pos));

        return this._grid.get(this.indexOf(pos))!;
    }
    public inBounds(pos: Vec2): boolean {
        return this._index_map.findIndex((loc) => {
            return pos.equals(loc);
        }) >= 0;
    }
    public neighbors(pos: Vec2): Vec2[] {
        const neighbor_offsets = [
            new Vec2(1, 0),
            new Vec2(0, 1),
            new Vec2(-1, 0),
            new Vec2(0, -1),
            new Vec2(-1, 1),
            new Vec2(1, -1)
        ];
        const neighbor_positions = neighbor_offsets.map((off: Vec2) => {
            return off.add(pos);
        });
        const valid_neighbors =
            neighbor_positions.filter(this.inBounds.bind(this));

        return valid_neighbors;
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
     * Handle a HexPosition component being updated on an entity
     * @see System.componentUpdated
     */
    public componentUpdated(entity: Entity, comp: Component, state: GameState):
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
