/**
 * @file client/js/desktop/GameUIState
 *
 * The in-game user interface includes a state machine to handle various
 * transitions (e.g. other player's turn -> my turn -> targeting -> etc). This
 * is the interface for each one of those states
 */
import { Observer } from "../../../game/util"
import { GameState } from "../../../game/GameState"

export type UIStateEvent = "action" | "change state" | "end turn";

export interface GameUIState extends Observer<UIStateEvent> {
    /**
     * Notify the state of a change in game state
     *
     * @param state: GameState
     */
    setState(state: GameState): void;
    /**
     * Enter
     */
    enter(): void;
    /**
     * Exit
     */
    exit(): void;
}
