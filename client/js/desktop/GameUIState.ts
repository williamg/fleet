/**
 * @file client/js/desktop/GameUIState
 *
 * The in-game user interface includes a state machine to handle various
 * transitions (e.g. other player's turn -> my turn -> targeting -> etc). This
 * is the base class for each one of those states
 */

import { GameState} from "../../../game/GameState"
import { UIObserver } from "./GameScreen"

export type SetUIStateCB = (new_state: GameUIState) => void;

export abstract class GameUIState {
    protected readonly _setUIState: SetUIStateCB;
    protected readonly _observer: UIObserver;

    constructor(setUIState: SetUIStateCB, observer: UIObserver) {
        this._setUIState = setUIState;
        this._observer = observer;
    }
    /**
     * Notify the state of a change in game state
     *
     * @param state: GameState
     */
    public abstract setState(state: GameState): void;
    /**
     * Enter
     */
    public abstract enter(): void;
    /**
     * Exit
     */
    public abstract exit(): void;
}
