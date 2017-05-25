/**
 * @file server/AIPlayer
 * Simple AI player. Does nothing but end their turn right now.
 * TODO: Make this slightly less stupid;
 */
import { TeamID } from "../game/components/Team"
import { Player } from "./Player"
import { GlobalState } from "../game/GlobalState"
import { END_TURN_EVENT, READY_EVENT } from "./Game"

export class AIPlayer extends Player {
    constructor(team: TeamID) {
        super("AI Player", team, 0);
    }

    public update(state: GlobalState): void {
        if (state.current_team != this.team) return;

        this.emit(END_TURN_EVENT);
    }

    public ready(): void {
        this.emit(READY_EVENT);
    }
}
