/**
 * @file client/js/desktop/GameUIState
 *
 * The in-game user interface includes a state machine to handle various
 * transitions (e.g. other player's turn -> my turn -> targeting -> etc). This
 * is the base class for each one of those states
 */

import { UIObserver, UISystems } from "./GameScreen"
import { HangerWindow } from "./HangerWindow"
import { TargetWindow } from "./TargetWindow"
import { Grid } from "./Grid"
import { GameState } from "../../../game/GameState"
import { Action } from "../../../game/Action"
import { TeamID } from "../../../game/components/Team"

export type SetUIStateCB = (new_state: GameUIState) => void;
export type ExecuteAction = (action: Action) => void;

export type GameUIStateParams = {
    readonly setUIState: SetUIStateCB,
    readonly executeAction: ExecuteAction,
    readonly systems: UISystems,
    readonly observer: UIObserver,
    readonly friendly: TeamID,
    readonly target_window: TargetWindow,
    readonly hanger_window: HangerWindow,
    readonly grid: Grid
    state: GameState
};

export abstract class GameUIState {
    protected readonly _params: GameUIStateParams;

    constructor(params: GameUIStateParams) {
        this._params = params;
    }
    /**
     * Notify the state of a change in game state
     *
     * @param state: GameState
     */
    public setState(state: GameState): void {
        this._params.state = state;
    }
    /**
     * Enter
     */
    public abstract enter(): void;
    /**
     * Exit
     */
    public abstract exit(): void;
}
