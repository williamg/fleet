/**
 * @file server/WebPlayer.ts
 * Performs action on behalf of a player
 */
import { Player } from "./Player"
import { Client } from "./Client"
import { END_TURN_EVENT, ACTION_EVENT, READY_EVENT } from "./Game"
import { Message, MessageType } from "../game/Message"
import { Action } from "../game/Action"
import { TeamID } from "../game/components/Team"
import { GlobalState } from "../game/GlobalState"
import { LOG } from "../game/util"

export class WebPlayer extends Player {
    private readonly client: Client;

    constructor(team: TeamID, client: Client) {
        super(client.username, team, client.id);

        this.client = client;
    }

    public update(state: GlobalState): void {
        const state_msg =
            new Message(MessageType.GAME_STATE, state.serialize());
        this.client.ws.send(state_msg.serialize());
    }

    public handleMessage(message: Message): void {
        if (message.type == MessageType.ACTION) {
            const action = Action.deserialize(message.data);

            this.emit(ACTION_EVENT, action);
        } else if (message.type == MessageType.END_TURN) {
            this.emit(END_TURN_EVENT);
        } else if (message.type == MessageType.READY) {
            this.emit(READY_EVENT);
        } else {
            LOG.WARN("Unexpected message type: " + message.type);
        }
    }
}
