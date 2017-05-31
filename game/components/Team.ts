/**
 * @file game/components/Team.ts
 */
import { Component, ComponentID, ComponentType } from "../Component"
import { Entity } from "../Entity"
import { ASSERT } from "../util"

export enum TeamID {
    TEAM_1,
    TEAM_2
};

export class Team  {
    public team: TeamID;

    /**
     * Get the other team
     * @param  {TeamID} team Not the other player
     * @return {TeamID}      The other player
     */
    static other(team: TeamID): TeamID {
        if (team == TeamID.TEAM_1) return TeamID.TEAM_2;
        return TeamID.TEAM_1
    }

    constructor(id: ComponentID, team: TeamID) {
        this.team = team;
    }
}
