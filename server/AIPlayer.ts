/**
 * @file server/AIPlayer
 * Simple AI player. Does nothing but end their turn right now.
 * TODO: Make this slightly less stupid;
 */
import { Player } from "./Player"
import { GameStateChanger, GameState } from "../game/GameState"
import { MatchInfo } from "../game/MatchInfo"
import { END_TURN_EVENT, READY_EVENT } from "./Game"
import { IDPool } from "../game/IDPool"
import { SystemRegistry } from "../game/System"

import { Change, CreateEntity, AttachComponent } from "../game/Changes"

import { Deployable, newDeployable } from "../game/components/Deployable"
import { Name, newName } from "../game/components/Name"
import { Team, TeamID, newTeam } from "../game/components/Team"

import { List } from "immutable"

export class AIPlayer extends Player {
    private _first_changes_rx: boolean = false;
    private _state: GameState = new GameState();
    private readonly _systems: SystemRegistry;

    constructor(team: TeamID) {
        super("AI Player", team);

        this._systems = new SystemRegistry(new IDPool(), this._state);

    }

    public matchFound(info: MatchInfo): void {
    }

    public initEntities(state: GameStateChanger, pool: IDPool): void {
        /* Create some hanger entities */
        for (let i = 0; i < 3; ++i) {
            const ent = pool.entity();
            state.makeChange(new CreateEntity(ent));

            const name = newName(pool.component(), {
                name: "Unfriendly " + i.toString()
            });
            const deployable = newDeployable(pool.component(), {
                deploy_cost: 10*i
            });
            const team = newTeam(pool.component(), {
                team: this.team
            });

            state.makeChange(new AttachComponent(ent, name));
            state.makeChange(new AttachComponent(ent, deployable));
            state.makeChange(new AttachComponent(ent, team));
        }
    }

    public handleChanges(changeset: List<Change>): void {
        /* Apply changeset */
        const changer = new GameStateChanger(this._state, this._systems);

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

        setTimeout(() => { this.emit(END_TURN_EVENT); }, 2000);
    }
}
