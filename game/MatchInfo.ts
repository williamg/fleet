/**
 * @file game/MatchInfo.ts
 * Class containing info about a match
 */
import { TeamID } from "./components/Team"
import { GameState } from "./GameState"

export class MatchInfo  {
    public readonly friendly: TeamID;

    constructor(friendly: TeamID) {
        this.friendly = friendly;
    }
};
