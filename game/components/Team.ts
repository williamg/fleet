/**
 * @file game/components/Team.ts
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export enum TeamID {
    TEAM_1,
    TEAM_2
};

export type TeamData = {
    team: TeamID;
}

export type Team = ComponentImpl<TeamData>;

export function newTeam(id: ComponentID, data: TeamData): Team {
    return new ComponentImpl(ComponentType.TEAM, id, data);
}

export function otherTeam(team: TeamID): TeamID {
    if (team == TeamID.TEAM_1) return TeamID.TEAM_2;
    return TeamID.TEAM_1
}
