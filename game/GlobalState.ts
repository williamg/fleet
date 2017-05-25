/**
 * @file game/GlobalState.ts
 */
import { EntityID } from "./Entity"
import { HexGrid } from "./HexGrid"
import { Messenger } from "./Messenger"
import { TeamID } from "./components/Team"

/**
 * Global state needed by all/multiple entities. State represented here spans
 * multiple entities such as spatial relationships between entities.
 * Any changes made to this state should be followed by a call to this
 * object's messenger.publish method, which alerts all subscribers
 * (entitites & components) of the change in state.
 */
export class GlobalState {
    readonly messenger: Messenger<GlobalState> = new Messenger<GlobalState>();
    readonly grid: HexGrid<EntityID | null> =
        new HexGrid<EntityID | null>((_) => { return null; });
    public current_team: TeamID;
    public turn_start: number;
    public started: boolean;

    public static deserialize(str: string): GlobalState {
        return new GlobalState();
    }

    constructor() {
        this.current_team = TeamID.TEAM_1;
        this.started = false;
    }
    /**
     * Serialize the global state
     *
     * @return Serialize global state
     */
    public serialize(): string {
        return "";
    }
}

/**
 * Neither player necessarily has access to the full state. For example, we may
 * want to implement "stealth" where certain entities aren't visible to the
 * enemy. For this reason, we need away to filter the global state from a
 * particular player's point of view. This is what actually gets sent to the
 * players
 */
export class VisibleState {
    /* The point of view for this state */
    readonly pov: TeamID;
    /* The filtered state */
    readonly state: GlobalState;

    public static deserialize(str: string): VisibleState {
        let pov = TeamID.TEAM_1;

        if (str.charAt(0) == "2") {
            pov = TeamID.TEAM_2;
        } else if (str.charAt(0) != "1") {
            throw new Error("Invalid VisibleState serialization");
        }

        const state = GlobalState.deserialize(str.substring(1));

        return new VisibleState(pov, state);
    }

    constructor(pov: TeamID, state: GlobalState) {
        this.pov = pov;
        this.state = state;
    }

    public serialize(): string {
        const pov = (this.pov == TeamID.TEAM_1) ? "1" : "2";

        return pov + this.state.serialize();
    }
}


