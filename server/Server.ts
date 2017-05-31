/**
 * @file server/Server.ts
 * Main class for the back-end server. For right now there is just a single
 * server that wears all the hats:
 *
 * - Matchmaking
 * - In-game logic
 * - TODO: Fleet management
 */
import { Client } from "./Client"
import { WebPlayer } from "./WebPlayer"
import { AIPlayer } from "./AIPlayer"
import { Game } from "./Game"
import { LOG, ASSERT } from "../game/util"
import { Message, MessageType } from "../game/Message"
import { TeamID } from "../game/components/Team"
import { GameState } from "../game/GameState"
import { MatchInfo } from "../game/MatchInfo"
import { serializeMessage, deserializeMessage } from "../game/serialization/MessageSerialization"

import * as WebSocket from "ws"

const WS_PORT = 8080;

export class Server {
    //private readonly match_maker: MatchMakingServer;
    //private readonly game_server: GameServer;
    private readonly wss: WebSocket.Server;

    constructor() {
        this.wss = new WebSocket.Server({ port: WS_PORT });

        /* Handle client connections */
        this.wss.on('connection', this.handleNewClient.bind(this));
    }
    /**
     * Authenticate a user by mapping a websocket to a Client
     *
     * We'll probably do this by migrating over to express and using Passport.
     *
     * @param {WebSocket}                ws      Websocket to authenticate
     * @param {(client: Client) => void} success Success callback
     * @param {() => void}               error   Error callback
     */
    private authenticate(ws: WebSocket, success: (client: Client) => void,
                         error: () => void): void {
        /* TODO */
        return success(new Client(1337, ws));
    }
    /**
     * Handle a new, unauthenticated client connection
     *
     * @param {WebSocket} ws Websocket
     */
    private handleNewClient(ws: WebSocket): void {
        this.authenticate(ws, (client: Client) => {
            const msg =
                new Message(MessageType.SERVER_STATUS, "Connected to server!");
            ws.send(serializeMessage(msg))

            ws.on('message', (message: string) => {
                this.handleMessage(client, deserializeMessage(message));
            });
        }, () => {});
    }
    /**
     * Handle a message from an authenticated client
     *
     * @param {Client}  client  Client sending the message
     * @param {Message} message Message sent by the client
     */
    private handleMessage(client: Client, message: Message) {
        LOG.DEBUG(`Received message ${message.type} from client ${client.id}`);

        switch (message.type) {
        case MessageType.PLAY_AI_MATCH:
            const web = new WebPlayer(TeamID.TEAM_1, client);
            client.player = web;

            const ai = new AIPlayer(TeamID.TEAM_2);

            /* Announce to both players that a match was found */
            const web_match_info = new MatchInfo(TeamID.TEAM_1)
            const ai_match_info = new MatchInfo(TeamID.TEAM_2)

            ai.matchFound(ai_match_info);
            web.matchFound(web_match_info);

            /* Initialize the game */
            const game = new Game([web, ai]);
            break;
        case MessageType.READY:
        case MessageType.ACTION:
        case MessageType.END_TURN:
            if (client.player == null) {
                LOG.ERROR("Received game message from client not in game");
                return;
            }

            client.player.handleMessage(message);
            break;
        }
    }
}
