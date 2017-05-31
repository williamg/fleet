/**
 * @file game/Message.ts
 * Class for handling message passing between the client and the server
 */
import { LOG, ASSERT } from "./util"

export enum MessageType {
    SERVER_STATUS,  /* Any message/status update from the server */
    FIND_PVP_MATCH, /* Client is requesting a pvp match          */
    PLAY_AI_MATCH,  /* Client is requesting an AI match          */
    MATCH_FOUND,    /* Server has found a match                  */
    READY,          /* Client ready to start                     */
    GAME_STATE,     /* In game, game state update                */
    CHANGESET,      /* In game, changeset                        */
    ACTION,         /* In game, make an action                   */
    END_TURN        /* In game, end the turn                     */
}

export class Message {
    public readonly type: MessageType;
    public readonly data: string;

    constructor(type: MessageType, data: any) {
        this.type = type;
        this.data = data;
    }
}
