/**
 * @file server/Server.ts
 * Main class for the back-end server. For right now there is just a single
 * server that wears all the hats:
 *
 * - Matchmaking
 * - In-game logic
 * - TODO: Fleet management
 */
import { LOG, ASSERT } from "../game/util"
import { Message, MessageType } from "../game/Message"

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

    private handleNewClient(ws: WebSocket): void {
        const msg =
            new Message(MessageType.SERVER_STATUS, "Connected to server!");
        ws.send(msg.serialize())

        setTimeout(() => { this.handleNewClient(ws); }, 2000);
    }
}
