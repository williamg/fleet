/**
 * @file client/js/main.ts
 * Client entry point
 */

import { UserInterface } from "./UserInterface"
import { MainMenu } from "./desktop/MainMenu"
import { Message, MessageType } from "../../game/Message"
import { serializeMessage, deserializeMessage }
    from "../../game/serialization/MessageSerialization"
import { deserializeChangeset } from "../../game/serialization/ChangeSerialization"
import { LOG } from "../../game/util"

import * as PIXI from "pixi.js"

/**
 * Websocket connection to server
 */
/*
 * Load assets so that we can show something to the user ASAP
 */
PIXI.loader.add('assets/ui/ui.json').load(() => {
    LOG.INFO("Finished loading assets");

    /* Connect to server */
    const ws = new WebSocket('ws://localhost:8080');

    /* Initialize the user interface */
    const ui = new UserInterface((msg: Message) => {
        ws.send(serializeMessage(msg));
    }, () => {});

    /* Install message handlers */
    ws.addEventListener('message', (event: MessageEvent) => {
        const message = deserializeMessage(event.data);

        ui.handleMessage(message);
    });

    /* TODO: open, close, error handlers */
});
