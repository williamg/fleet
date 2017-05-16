/**
 * @file game/components/Team.ts
 */
import { Component } from "../Component"
import { Entity } from "../Entity"
import { PlayerID } from "../Player"

export class Team extends Component {
    team: PlayerID;

    constructor(entity: Entity, team: PlayerID) {
        super(entity);

        this.team = team;
    }
}
