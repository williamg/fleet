/**
 * @file server/Client.ts
 * The server's representation of a client
 */
import { WebPlayer } from "./WebPlayer"

import * as WebSocket from "ws"

export class Client {
    public readonly id: number;
    public readonly username: string;
    public readonly ws: WebSocket;
    public player: WebPlayer | null;

    constructor(id: number, ws: WebSocket) {
        this.id = id;
        this.ws = ws;
        this.username = "Ganashaw";
    }
}
