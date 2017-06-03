/**
 * @file client/js/dekstop/MyTurn.ts
 *
 * The UIState for when it is this player's turn. Allows selecting entities
 * for more info, transtitioning to Move, Deploy, and UseItem states, as well
 * as ending the user's turn.
 */
import { GameUIState, SetUIStateCB, GameUIStateParams } from "./GameUIState"
import { UIObserver, UISystems } from "./GameScreen"
import { OtherPlayerTurn } from "./OtherPlayerTurn"
import { DeployState } from "./Deploy"
import { TargetWindow, CancelPos } from "./TargetWindow"
import { HangerWindow } from "./HangerWindow"
import { Grid } from "./Grid"
import { GameState } from "../../../game/GameState"
import { Entity } from "../../../game/Entity"
import { Vec2 } from "../../../game/Math"
import { TeamID } from "../../../game/components/Team"

export class MyTurn extends GameUIState {

    /**
     * Handler references
     */
    private readonly _onDeploy = this.onDeploy.bind(this);
    private readonly _onHangerSelected = this.onHangerSelected.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);

    constructor(params: GameUIStateParams) {
        super(params);
    }
    /**
     * When our turn ends, transition into the other player's turn state
     *
     * @param {GameState} state New game state
     */
    public setState(state: GameState): void {
        super.setState(state);

        if (state.current_team != this._params.friendly) {
            const state = new OtherPlayerTurn(this._params);
            this._params.setUIState(state);
        }
    }
    /**
     * Set up event handlers on enter
     */
    public enter(): void {
        this._params.observer.addListener("deploy", this._onDeploy);
        this._params.observer.addListener("hanger selected", this._onHangerSelected);
        this._params.observer.addListener("hex clicked", this._onHexSelected);

        this._params.target_window.setButtonTrayVisible(true);
    }
    /**
     * Tear down event handlers on exit
     */
    public exit(): void {
        this._params.observer.removeListener("deploy", this._onDeploy);
        this._params.observer.removeListener("hanger selected",
                                      this._onHangerSelected);
        this._params.observer.removeListener("hex clicked", this._onHexSelected);

        this._params.target_window.setCancelButton(CancelPos.HIDDEN);
    }
    private onDeploy(entity: Entity): void {
        const deploy = new DeployState(this._params, entity);
        this._params.setUIState(deploy);
    }
    private onHangerSelected(entity: Entity): void {
        this._params.target_window.setTarget(entity);
    }
    private onHexSelected(hex: Vec2): void {
    }
}
