/**
 * @file game/filters/Reachable.ts
 */
import { Filter } from "../Filter"
import { GlobalState } from "../GlobalState"
import { Vec2 } from "../Math"

export class Reachable extends Filter<Vec2> {
    private readonly _reachable: Vec2[];

    constructor(state: GlobalState, start: Vec2, max_dist: number) {
        super();

        /* Precompute all reachable locations with BFS */
        let visited: Vec2[] = [ start ];
        let fringes: (Vec2[])[] = [];
        fringes.push(visited);

        for (let i = 1; i <= max_dist; ++i) {
            fringes.push([]);
            for (let coord of fringes[i-1]) {
                for (let neighbor of state.grid.neighbors(coord)) {
                    if (state.grid.at(neighbor) != null) continue;

                    let already_visited = false;
                    for (let prev of visited) {
                        if (prev.equals(neighbor)) already_visited = true;
                    }

                    if (already_visited) continue;

                    visited.push(neighbor);
                    fringes[i].push(neighbor);
                }
            }
        }

        this._reachable = fringes[max_dist];
    }

    filter(vals: Vec2[]): Vec2[] {
        /* Because JS Sets don't do what you'd expect with Objects... */
        return vals.filter((v) => {
            for (let r of this._reachable) {
                if (r.equals(v)) return true;
            }

            return false;
        });
    }

    matches(val: Vec2): boolean {
        return this.filter([ val ]).length == 1;
    }
}
