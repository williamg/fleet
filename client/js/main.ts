/**
 * @file client/js/main.ts
 * Client entry point
 */

import { UserInterface } from "./UserInterface"
import { MainMenu } from "./desktop/MainMenu"
import { GameScreen } from "./desktop/GameScreen"
import { GameInputHandler } from "./desktop/GameInputHandler"
import { GameState } from "../../game/GameState"
import { Message, MessageType } from "../../game/Message"
import { deserializeMatchInfo } from "../../game/serialization/MatchSerialization"
import { serializeMessage, deserializeMessage }
    from "../../game/serialization/MessageSerialization"
import { deserializeChangeset } from "../../game/serialization/ChangeSerialization"



/* DEBUG */
const app = new PIXI.Application(1920, 1080);
/*const input_handler = new GameInputHandler(app);
let game_screen = new GameScreen(input_handler, 0,
                                     new GameState());*/
//ui.setScene(game_screen!, () => {});
let did_ready = false;
let game_screen: GameScreen | undefined = undefined;

const main_menu = new MainMenu();
const ui = new UserInterface(app, main_menu, () => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.addEventListener('message', (event: MessageEvent) => {
        handleMessage(ws, event);
    });
});

function handleMessage(ws: WebSocket, event: MessageEvent) {
    const msg = deserializeMessage(event.data);

    if (msg.type == MessageType.SERVER_STATUS) {
        main_menu.appendMessage(msg.data);

        /* Assume connected, find match */
        const find_match = new Message(MessageType.PLAY_AI_MATCH, "");
        ws.send(serializeMessage(find_match));
    } else if (msg.type == MessageType.MATCH_FOUND) {
        /* Found match transition to game view */
        main_menu.appendMessage("Match found!");

        const match_info = deserializeMatchInfo(msg.data);
        const input_handler = new GameInputHandler(app);
        game_screen = new GameScreen(input_handler, match_info.friendly,
                                     new GameState());
    } else if (msg.type == MessageType.CHANGESET) {
        if (!did_ready) {
            console.log("Received first changeset");
            game_screen!.handleChanges(deserializeChangeset(msg.data));
            ui.setScene(game_screen!, () => {
                did_ready = true;
                const ready = new Message(MessageType.READY, "");
                ws.send(serializeMessage(ready));
            });
        } else {
            game_screen!.handleChanges(deserializeChangeset(msg.data));
        }
    }
}
