/**
 * @file server/AIPlayer
 * Simple AI player. Does nothing but end their turn right now.
 * TODO: Make this slightly less stupid;
 */
import { TeamID } from "../game/components/Team"
import { Player } from "./Player"
import { GameStateChanger, GameState } from "../game/GameState"
import { Change } from "../game/Changes"
import { MatchInfo } from "../game/MatchInfo"
import { END_TURN_EVENT, READY_EVENT } from "./Game"

import { List } from "immutable"

export class AIPlayer extends Player {
    private _first_changes_rx: boolean = false;
    private _state: GameState = new GameState();

    constructor(team: TeamID) {
        super("AI Player", team);
    }

    public matchFound(info: MatchInfo): void {
    }

    public initEntities(state: GameStateChanger): void {
        return;
    }

    public handleChanges(changeset: List<Change>): void {
        /* Apply changeset */
        const changer = new GameStateChanger(this._state, []);

        changeset.forEach((change) => {
            if (!change) return false;
            changer.makeChange(change);
        });

        this._state = changer.state;

        /* Announce that we're ready if this was the first changeset */
        if (!this._first_changes_rx) {
            this._first_changes_rx = true;
            this.emit(READY_EVENT);
        }

        if (this._state.current_team != this.team) return;
        if (!this._state.started) return;

        this.emit(END_TURN_EVENT);
    }
}
