/**
 * @file client/js/game/NotMyTurnUIState.ts
 *
 * The UIState for when it is not this player's turn. Allows selecting entities
 * for more info but nothing else.
 */
import { GameUIState, UIStateEvent } from "./GameUIState"
import { MyTurnUIState } from "./MyTurnUIState"
import { GameView, HexStyle } from "./GameView"

import { GameState } from "../../../game/GameState"
import { Entity } from "../../../game/Entity"
import { Vec2 } from "../../../game/Math"
import { SystemRegistry } from "../../../game/System"
import { Observer } from "../../../game/util"

import { TeamID } from "../../../game/components/Team"

import { GridSystem } from "../../../game/systems/GridSystem"

export class NotMyTurnUIState extends Observer<UIStateEvent> implements GameUIState {
    /**
     * Game view
     * @type {GameView}
     */
    private readonly _view: GameView;
    /**
     * System registry
     * @type {SystemRegistry}
     */
    private readonly _systems: SystemRegistry;
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
    private readonly _onHangerSelected = this.onHangerSelected.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);

    constructor(view: GameView, systems: SystemRegistry, friendly: TeamID,
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

        if (this._game_state.current_team == this._friendly) {
            const uistate = new MyTurnUIState(
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
        this._view.setItems(false);

        this._view.addListener("hex click", this._onHexSelected);
        this._view.addListener("hanger ship click", this._onHangerSelected);
    }
    /**
     * @see client/js/game/GameUIState
     */
    public exit(): void {
        this._view.removeListener("hex click", this._onHexSelected);
        this._view.removeListener("hanger ship click", this._onHangerSelected);
    }
    private onHangerSelected(entity: Entity): void {
        this._view.clearHexStyles();
        this._view.showEntityInfo(entity);
    }
    private onHexSelected(hex: Vec2): void {
        const grid_system = this._systems.lookup(GridSystem);
        const status = grid_system.occupancyStatus(hex);

        if (status != "free" && status != "unknown") {
            this._view.showEntityInfo(status);
            this._view.clearHexStyles();
            this._view.setHexStyle(hex, HexStyle.SELECTED);
        }
    }
}
