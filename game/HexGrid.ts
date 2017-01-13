/**
 * @file game/HexGrid.ts
 * Describes a grid of hexagonal tiles. Heavily inspired by Amit's guide:
 * http://www.redblobgames.com/grids/hexagons/
 */

import { Vec2 } from "./Math";
import { ASSERT } from "./util"

/* Coordinates that make up the map */
export const MAP = [
    [0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, -1], [-1, 1],
    [-2, 0], [0, 2], [2, 0], [0, -2], [1, 1], [-1, -1], [2, -1],
    [-2, 1], [1, -2], [-1, 2], [-2, 2], [2, -2], [3, 0], [-3, 0], [2, 1],
    [-2, -1],  [3, -3], [-3, 3], [4, -3], [-4, 1], [-3, 1], [-3, 2],
    [-4, 3], [4, -2], [-4, 2], [-2, 3],
    [3, -1], [3, -2], [2, -3], [4, -1]
];
/**
 * Directions of neighbors
 * @type {Array}
 */
const NEIGHBOR_DIRS = [
    new Vec2(0, 1), new Vec2(1, 0),
    new Vec2(-1, 0), new Vec2(0, -1),
    new Vec2(-1, 1), new Vec2(1, -1)
];
/**
 * Given a float hex coordinate, round it to an integral hex coordinate
 * @param  {Vec2} coord Potentially floating hex coord
 * @return {Vec2}       Rounded, integral hex coord
 */
export function hexRound(coord: Vec2): Vec2 {
    const z = -coord.x - coord.y;

    var rx = Math.round(coord.x);
    var ry = Math.round(coord.y);
    var rz = Math.round(z);
    let tmp = 0;

    const x_diff = Math.abs(rx - coord.x);
    const y_diff = Math.abs(ry - coord.y);
    const z_diff = Math.abs(rz - z);

    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry - rz;
    } else if (y_diff > z_diff) {
        ry = -rz - rx;
    }

    return new Vec2(rx, ry);
}
/**
 * Describes a hexagonal grid with the sturcutre described my MAP
 */
export class HexGrid<T> {
    readonly size: number;  /* Number of tiles in the grid */
    cells: [Vec2, T][];     /* Cells in the grid           */

    constructor(val: (pos: Vec2) => T) {
        this.size = MAP.length
        this.cells = new Array(MAP.length);

        for (let i = 0; i < this.size; ++i) {
            const [x, y] = MAP[i];
            const pos = new Vec2(x, y);
            this.cells[i] = [pos, val(pos)];
        }
    }
    /**
     * Get the value at a position
     * @param  {Vec2}      coord Hex position
     * @return {T | null}        Value
     */
    at(coord: Vec2): (T | null) {
        coord = hexRound(coord);

        for (let [cell_coord, val] of this.cells) {
            if (coord.equals(cell_coord)) return val;
        }

        ASSERT(false);
        return null;
    }
    /**
     * Set the value at a position
     * @param {Vec2} coord Position to set
     * @param {T}    val   Value to set
     */
    set(coord: Vec2, val: T): void {
        coord = hexRound(coord);

        for (let i = 0; i < this.cells.length; ++i) {
            let [cell_coord, _] = this.cells[i];

            if (coord.equals(cell_coord)) this.cells[i] = [cell_coord, val];
        }
    }
    /**
     * Get the neighbors of a cell
     * @param  {Vec2}   coord Location of cell to get neighbors of
     * @return {Vec2[]}       Array of neighbor locations
     */
    neighbors(coord: Vec2): Vec2[] {
        let neighbors: Vec2[] = [];

        for (let dir of NEIGHBOR_DIRS) {
            let n = coord.add(dir);
            if (this.inBounds(n)) {
                neighbors.push(n);
            }
        }

        return neighbors;
    }
    /**
     * Determine whether or not a location is in bounds
     * @param  {Vec2}    coord Location to check
     * @return {boolean}       Whether or not coord is in bounds
     */
    inBounds(coord: Vec2): boolean {
        coord = hexRound(coord);

        for (let [cell_coord, val] of this.cells) {
            if (coord.equals(cell_coord)) return true;
        }

        return false;
    }
};
