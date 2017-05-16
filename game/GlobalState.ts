/**
 * @file game/GlobalState.ts
 */
import { EntityID } from "./Entity"
import { HexGrid } from "./HexGrid"
import { Messenger } from "./Messenger"
import { PlayerID } from "./Player"

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
    current_player: PlayerID;
    turn_start: number;
    started: boolean;

    constructor() {
        this.current_player = PlayerID.PLAYER_1;
        this.started = false;
    }
}
