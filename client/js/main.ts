/**
 * @file client/js/main.ts
 * Client entry point
 */

import { UserInterface } from "./UserInterface"
import { WebPlayer } from "./WebPlayer"
import { MainMenu } from "./desktop/MainMenu"
import { initGame } from "../../game/Game"
import { PlayerID, AIPlayer} from "../../game/Player"
import { GlobalState } from "../../game/GlobalState"

const ui = new UserInterface(() => {});

function initGameScreen(id: PlayerID, input_handler: GameInputHandler,
                        state: GlobalState): void {
    const game_screen = new GameScreen(id, input_handler, state);
    ui.setScene(game_screen, () => {
        startGame();
    });
}

function onStateUpdate(state: GlobalState): void {
}

/* User clicks on "play", match is found */
const user_player = new WebPlayer(initGameScreen, onStateUpdate);


