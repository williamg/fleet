/**
 * @file game/Target.ts
 */

import { Vec2, hexDist } from "./Math"
import { hex_round } from "./HexGrid"
import { GameState } from "./Game"
import { PlayerID } from "./Player"

export type TargetConstraint =
    (source: number, target: Vec2, state: GameState) => boolean

/**
 * When an ability takes a target, they provide an object of this type to be
 * used to validate potential targets.
 */
export class TargetDescription {
    private readonly constraints: TargetConstraint[];

    /** Constructs a target description that matches anything */
    constructor(constraints: TargetConstraint[]) {
        this.constraints = constraints;
    }
    /**
     * Determine if the given source, target, and state match this description
     * @param  {number}    source ID of source ship
     * @param  {Vec2}      target Target location
     * @param  {GameState} state  State of the game
     * @return {boolean}          Whether or not the target matches
     */
    matches(source: number, target: Vec2, state: GameState): boolean {
        for (let constraint of this.constraints) {
            if (!constraint(source, target, state)) return false;
        }

        return true;
    }
};
/**
 * Constructs a TargetConstraint for checking if the target is reachable from
 * the source
 * @param  {number}           max_moves Maximum number of moves allowed
 * @return {TargetConstraint}           Target constraint
 */
export function targetReachable(max_moves: number): TargetConstraint {
    /* Note: Will return false if the target has a ship on it, even if the path
     * to that hex is free.
     */
    function isReachable(source: number, target: Vec2, state: GameState):
        boolean {
        let visited: Vec2[] = [ state.getShip(source)!.position! ];
        let fringes: (Vec2[])[] = [];
        fringes.push(visited);

        for (let i = 1; i <= max_moves; ++i) {
            fringes.push([]);
            for (let coord of fringes[i-1]) {
                for (let neighbor of state.grid.neighbors(coord)) {
                    if (state.grid.at(neighbor) != null) continue;

                    let already_visited = false;
                    for (let prev of visited) {
                        if (prev.equals(neighbor)) already_visited = true;
                    }

                    if (already_visited) continue;

                    if (neighbor.equals(target)) return true;
                    fringes[i].push(neighbor);
                }

            }
        }

        return false;
    }

    return isReachable;
}
/**
 * Constructs a TargetConstraint that matches targets within a certain distance
 * of the source
 * @param  {number}           max_range Maximum range
 * @return {TargetConstraint}           Target constraint
 */
export function targetInRange(max_range: number): TargetConstraint {
    function isInRange(source: number, target: Vec2, state: GameState):
        boolean {
        const ship = state.getShip(source);

        if (ship == null) return false;
        if (ship.position == null) return false;

        return hexDist(ship.position, target) <= max_range;
    }

    return isInRange;
}
/**
 * Constructs a TargetConstraint that matches targets with a certain player.
 * Note that this implicitly rejeccts all empty hexes.
 * @param  {PlayerID}         player Player to match
 * @return {TargetConstraint}        Target constraint
 */
export function targetHasPlayer(player: PlayerID): TargetConstraint {
    function hasPlayer(source: number, target: Vec2, state: GameState):
        boolean {
        const ship = state.grid.at(target);

        if (ship == null) return false;

        return ship.player == player;
    }

    return hasPlayer;
}
/**
 * Constructs a TargetConstraint that matches any target that is the same as one
 * in the provided list
 * @param  {Vec2[]}           options Possible targets
 * @return {TargetConstraint}         Target constraint
 */
export function targetIsOneOf(options: Vec2[]): TargetConstraint {
        function isOneOf(source: number, target: Vec2, state: GameState):
            boolean {

            for (let option of options) {
                if (target.equals(option)) return true;
            }

            return false;
        }

        return isOneOf;
}
