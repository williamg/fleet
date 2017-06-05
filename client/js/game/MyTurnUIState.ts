/**
 * @file client/js/game/MyTurnUIState.ts
 *
 * The UIState for when it is this player's turn. Allows selecting entities
 * for more info, transtitioning to Move, Deploy, and UseItem states, as well
 * as ending the user's turn.
 */
import { GameUIState, UIStateEvent } from "./GameUIState"
import { ClientGameSystems } from "./GameScene"
import { NotMyTurnUIState } from "./NotMyTurnUIState"
import { DeployUIState } from "./DeployUIState"
import { MoveUIState } from "./MoveUIState"
import { GameView, HexStyle } from "./GameView"

import { GameState } from "../../../game/GameState"
import { Entity } from "../../../game/Entity"
import { Vec2 } from "../../../game/Math"
import { Observer } from "../../../game/util"

import { TeamID } from "../../../game/components/Team"

export class MyTurnUIState extends Observer<UIStateEvent> implements GameUIState {
    /**
     * Game view
     * @type {GameView}
     */
    private readonly _view: GameView;
    /**
     * Systems
     * @type {ClientGameSystems}
     */
    private readonly _systems: ClientGameSystems;
    /**
     * Friendly team
     * @type {TeamID}
     */
    private readonly _friendly: TeamID;
    /**
     * Game state
     * @type {GameState}
     */
    private _game_state: GameState;
    /**
     * Handler references
     */
    private readonly _onDeploy = this.onDeploy.bind(this);
    private readonly _onEndTurn = this.onEndTurn.bind(this);
    private readonly _onHangerSelected = this.onHangerSelected.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);
    private readonly _onItem = this.onItem.bind(this);
    private readonly _onMove = this.onMove.bind(this);

    constructor(view: GameView, systems: ClientGameSystems, friendly: TeamID,
                game_state: GameState) {
        super();

        this._view = view;
        this._systems = systems;
        this._friendly = friendly;
        this._game_state = game_state;
    }
    /**
     * @see client/js/game/GameUIState
     */
    public setState(state: GameState): void {
        this._game_state = state;

        if (this._game_state.current_team != this._friendly) {
            const uistate = new NotMyTurnUIState(
                this._view, this._systems, this._friendly, this._game_state);
            this.emit("change state", uistate);
        }
    }
    /**
     * @see client/js/game/GameUIState
     */
    public enter(): void {
        this._view.setHangerTargeting(true);
        this._view.setGridTargeting(true);
        this._view.setItems(true);

        this._view.addListener("hex click", this._onHexSelected);
        this._view.addListener("hanger ship click", this._onHangerSelected);
        this._view.addListener("end turn", this._onEndTurn);
        this._view.addListener("deploy", this._onDeploy);
        this._view.addListener("item", this._onItem);
        this._view.addListener("move", this._onMove);
    }
    /**
     * @see client/js/game/GameUIState
     */
    public exit(): void {
        this._view.removeListener("hex click", this._onHexSelected);
        this._view.removeListener("hanger ship click", this._onHangerSelected);
        this._view.removeListener("end turn", this._onEndTurn);
        this._view.removeListener("deploy", this._onDeploy);
        this._view.removeListener("item", this._onItem);
        this._view.removeListener("move", this._onMove);
    }
    private onDeploy(entity: Entity): void {
        const deploy =
            new DeployUIState(this._view, this._systems, this._friendly,
                              this._game_state, entity);

        this.emit("change state", deploy);
    }
    private onEndTurn(): void {
        this.emit("end turn");
    }
    private onHangerSelected(entity: Entity): void {
        this._view.clearHexStyles();
        this._view.showEntityInfo(entity);
    }
    private onHexSelected(hex: Vec2): void {
        const status = this._systems.grid.occupancyStatus(hex);

        if (status != "free" && status != "unknown") {
            this._view.showEntityInfo(status);
            this._view.clearHexStyles();
            this._view.setHexStyle(hex, HexStyle.SELECTED);
        }
    }
    private onItem(): void {
    }
    private onMove(entity: Entity): void {
        const move =
            new MoveUIState(this._view, this._systems, this._friendly,
                            this._game_state, entity);
        this.emit("change state", move);
    }
}
