/**
 * @file client/js/main.ts
 * Client entry point
 */

import { UserInterface } from "./UserInterface"
import { MainMenu } from "./desktop/MainMenu"
import { GameScreen } from "./desktop/GameScreen"
import { GameInputHandler } from "./desktop/GameInputHandler"
import { GlobalState, VisibleState } from "../../game/GlobalState"
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
        const find_match = new Message(MessageType.PLAY_AI_MATCH, "");
        ws.send(find_match.serialize());
    } else if (msg.type == MessageType.MATCH_FOUND) {
        /* Found match transition to game view */
        main_menu.appendMessage("Match found!");

        const initial_state = VisibleState.deserialize(msg.data);
        const input_handler = new GameInputHandler();
        const game_screen = new GameScreen(input_handler, initial_state.pov,
                                           initial_state.state);
        ui.setScene(game_screen, () => {
            const ready = new Message(MessageType.READY, "");
            ws.send(ready.serialize());
        });
    }
}
