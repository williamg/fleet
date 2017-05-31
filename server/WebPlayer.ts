/**
 * @file server/WebPlayer.ts
 * Performs action on behalf of a player
 */
import { Player } from "./Player"
import { Client } from "./Client"
import { END_TURN_EVENT, ACTION_EVENT, READY_EVENT } from "./Game"
import { Message, MessageType } from "../game/Message"
import { serializeMessage } from "../game/serialization/MessageSerialization"
import { serializeMatchInfo } from "../game/serialization/MatchSerialization"
import { deserializeAction } from "../game/serialization/ActionSerialization"
import { serializeChangeset } from "../game/serialization/ChangeSerialization"
import { MatchInfo } from "../game/MatchInfo"
import { Change } from "../game/Changes"
import { Action } from "../game/Action"
import { TeamID } from "../game/components/Team"
import { GameStateChanger } from "../game/GameState"
import { LOG } from "../game/util"

import { List } from "immutable"

export class WebPlayer extends Player {
    private readonly client: Client;

    constructor(team: TeamID, client: Client) {
        super(client.username, team);

        this.client = client;
    }
    /**
     * TODO: Lookup this client's fleet and init the entities
     *
     * @param {GameStateChanger} state State to modify
     */
    public initEntities(state: GameStateChanger): void {
    }
    /**
     * Notify the client that a match has been found
     *
     * @param {MatchInfo} info Match info
     */
    public matchFound(info: MatchInfo): void {
        const match_msg =
            new Message(MessageType.MATCH_FOUND, serializeMatchInfo(info));
        this.client.ws.send(serializeMessage(match_msg));
    }
    /**
     * Handle a set of changes to the state
     *
     * @param {List<Change>} changeset Set of changes
     */
    public handleChanges(changeset: List<Change>): void {
        const changeset_str = serializeChangeset(changeset);
        const changeset_msg = new Message(MessageType.CHANGESET, changeset_str);

        this.client.ws.send(serializeMessage(changeset_msg));
    }
    /**
     * Handle a message from the client
     *
     * @param {Message} message Message received from the client
     */
    public handleMessage(message: Message): void {
        if (message.type == MessageType.ACTION) {
            const action = deserializeAction(message.data);
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
