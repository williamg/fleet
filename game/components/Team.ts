/**
 * @file game/components/Team.ts
 */
import { Component } from "../Component"
import { Entity } from "../Entity"

export enum TeamID {
    TEAM_1,
    TEAM_2
};

export class Team extends Component {
    team: TeamID;

    /**
     * Get the other team
     * @param  {TeamID} team Not the other player
     * @return {TeamID}      The other player
     */
    static other(team: TeamID): TeamID {
        if (team == TeamID.TEAM_1) return TeamID.TEAM_2;
        return TeamID.TEAM_1
    }

    constructor(entity: Entity, team: TeamID) {
        super(entity);

        this.team = team;
    }
}
