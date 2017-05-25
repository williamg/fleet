/**
 * @file server/Game.ts
 * Functionality and datastructure related to actually playing a match
 */
import { Action, ActionType } from "../game/Action"
import { Entity } from "../game/Entity"
import { GlobalState } from "../game/GlobalState"
import { HexGrid } from "../game/HexGrid"
import { Vec2 } from "../game/Math"
import { Player } from "./Player"
import { Team, TeamID } from "../game/components/Team"
import { LOG } from "../game/util"

export const END_TURN_EVENT = "endturn";
export const ACTION_EVENT = "action";
export const READY_EVENT = "ready";

/**
 * Maximum turn length in milliseconds
 * @type {Number}
 */
export const TURN_TIMEOUT = 10000;

export class Game {
    public readonly state: GlobalState = new GlobalState();

    private readonly players: [Player, Player];
    private readys: [boolean, boolean];
    private turn_timeout: number | null = null;

    constructor(players: [Player, Player]) {
        this.players = players;
        this.readys = [false, false];

        /* Install event handlers */
        const [p1, p2] = this.players;

        for (const p of this.players) {
            p.on(END_TURN_EVENT, () => {
                this.endTurn(p.team);
            });
            p.on(ACTION_EVENT, (action: Action) => {
                this.handleAction(p.team, action);
            });
            p.on(READY_EVENT, () => {
                this.ready(p.team);
            });
        }
    }
    private ready(team: TeamID): void {
        let [ra, rb] = this.readys;
        let [pa, pb] = this.players;

        if (pa.team == team) {
            ra = true;
        } else {
            rb = true;
        }

        this.readys = [ra, rb];

        if (ra && rb) {
            LOG.INFO("Both players ready, starting game.");
            this.startTurn();
        }
    }

    private startTurn() {
        const player = this.getCurrentPlayer();

        this.state.turn_start = Date.now();
        this.turn_timeout = <any>setTimeout(() => {
            this.endTurn(player.team);
        }, TURN_TIMEOUT);

        const [p1, p2] = this.players;
        p1.update(this.state);
        p2.update(this.state);
    }

    public handleAction(team: TeamID, action: Action) {
        const player = this.getCurrentPlayer();

        if (player.team != team) return;

        if (action.execute()) {
            const [p1, p2] = this.players;
            p1.update(this.state);
            p2.update(this.state);
        }
    }

    public endTurn(team: TeamID) {
        const player = this.getCurrentPlayer();

        if (player.team != team) return;

        if (this.turn_timeout != null) {
            clearTimeout(this.turn_timeout);
        }

        for (let entity of Entity.all()) {
            const team = entity.getComponent(Team);

            if (team == null) continue;
            if (team.team != this.state.current_team) continue;

            entity.processTurnEnd();
        }

        this.state.current_team = Team.other(this.state.current_team);
        this.state.messenger.publish(this.state);
        this.startTurn();
    }

    private getCurrentPlayer(): Player {
        const [p1, p2] = this.players;

        if (this.state.current_team == p1.team) return p1;
        return p2;
    }
}
