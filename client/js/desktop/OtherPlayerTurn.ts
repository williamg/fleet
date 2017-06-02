/**
 * @file client/js/dekstop/GameUIState
 *
 * The UIState for when it is this player's turn. Allows selecting entities
 * for more info, transtitioning to Move, Deploy, and UseItem states, as well
 * as ending the user's turn.
 */
import { GameUIState, SetUIStateCB } from "./GameUIState"
import { UIObserver } from "./GameScreen"
import { MyTurn } from "./MyTurn"
import { TargetWindow } from "./TargetWindow"
import { HangerWindow } from "./HangerWindow"
import { Grid } from "./Grid"
import { GameState } from "../../../game/GameState"
import { Entity } from "../../../game/Entity"
import { Vec2 } from "../../../game/Math"
import { TeamID } from "../../../game/components/Team"

export class OtherPlayerTurn extends GameUIState {
    /**
     * This player's team
     * @type {TeamID}
     */
    private readonly _friendly: TeamID;
    /**
     * Target window
     * @type {TargetWindow}
     */
    private readonly _target_window: TargetWindow;
    /**
     * Hanger window
     * @type {HangerWindow}
     */
    private readonly _hanger_window: HangerWindow;
    /**
     * Grid
     * @type {Grid}
     */
    private readonly _grid: Grid;

    constructor(setUIState: SetUIStateCB, observer: UIObserver,
                friendly: TeamID, target_window: TargetWindow,
                hanger_window: HangerWindow, grid: Grid) {
        super(setUIState, observer);

        this._friendly = friendly;
        this._target_window = target_window
        this._hanger_window = hanger_window;
        this._grid = grid;
    }
    /**
     * When our turn ends, transition into the other player's turn state
     *
     * @param {GameState} state New game state
     */
    public setState(state: GameState): void {
        if (state.current_team == this._friendly) {
            const state =
                new MyTurn(this._setUIState, this._observer, this._friendly,
                           this._target_window, this._hanger_window, 
                           this._grid);
            this._setUIState(state);
        }
    }
    /**
     * Set up event handlers on enter
     */
    public enter(): void {
        this._observer.addListener("deploy", this.onDeploy.bind(this));
        this._observer.addListener("hanger selected",
                                   this.onHangerSelected.bind(this));
        this._observer.addListener("hex clicked", this.onHexSelected.bind(this));

        this._target_window.setButtonTrayVisible(false);
    }
    /**
     * Tear down event handlers on exit
     */
    public exit(): void {
        this._observer.removeListener("deploy", this.onDeploy.bind(this));
        this._observer.removeListener("hanger selected",
                                      this.onHangerSelected.bind(this));
        this._observer.removeListener("hex clicked",
                                      this.onHexSelected.bind(this));
    }
    private onDeploy(entity: Entity): void {
    }
    private onHangerSelected(entity: Entity): void {
        this._target_window.setTarget(entity);
    }
    private onHexSelected(hex: Vec2): void {
    }
}
