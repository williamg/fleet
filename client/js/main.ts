/**
 * @file client/js/main.ts
 * Client entry point
 */

import { UserInterface } from "./UserInterface"
import { MainMenu } from "./desktop/MainMenu"
import { initGame } from "../../game/Game"
import { PlayerID, AIPlayer} from "../../game/Player"
import { GlobalState } from "../../game/GlobalState"
import { Message, MessageType } from "../../game/Message"

const ws = new WebSocket('ws://localhost:8080');
ws.addEventListener('message', handleMessage);

const main_menu = new MainMenu();
const ui = new UserInterface(main_menu, () => {});

function handleMessage(event: MessageEvent) {
    const msg = Message.deserialize(event.data);

    if (msg.type == MessageType.SERVER_STATUS) {
        main_menu.appendMessage(msg.data);

        /* Assume connected, find match */
        const find_match = new Message(MessageType.FIND_MATCH, "");
        ws.send(find_match.serialize());
    } else if (msg.type == MessageType.MATCH_FOUND) {
        /* Found match, wait for initial game */
    }
}
