/**
 * @file game/Message.ts
 * Class for handling message passing between the client and the server
 */
import { LOG, ASSERT } from "./util"

export enum MessageType {
    SERVER_STATUS,  /* Any message/status update from the server */
    FIND_MATCH,     /* Client is requesting a match              */
    MATCH_FOUND,    /* Server has found a match                  */
    GAME_STATE,     /* In game, game state update                */
}

export class Message {
    public readonly type: MessageType;
    public readonly data: string;

    constructor(type: MessageType, data: string) {
        this.type = type;
        this.data = data;
    }

    public serialize(): string {
        return JSON.stringify({ type: this.type, data: this.data });
    }

    static deserialize(blob: string): Message {
        const json = JSON.parse(blob) as {type: MessageType, data: string};

        ASSERT(json.type != undefined);
        ASSERT(json.data != undefined);

        return new Message(json.type, json.data);
    }
}
