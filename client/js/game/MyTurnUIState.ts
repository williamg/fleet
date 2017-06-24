/**
 * @file client/js/game/MyTurnUIState.ts
 *
 * The UIState for when it is this player's turn. Allows selecting entities
 * for more info, transtitioning to Move, Deploy, and UseItem states, as well
 * as ending the user's turn.
 */
import { GameUIState, UIStateEvent } from "./GameUIState"
import { NotMyTurnUIState } from "./NotMyTurnUIState"
import { DeployUIState } from "./DeployUIState"
import { MoveUIState } from "./MoveUIState"
import { TargetUIState } from "./TargetUIState"
import { GameView, HexStyle } from "./GameView"

import { UseItem } from "../../../game/Action"
import { GameState } from "../../../game/GameState"
import { ComponentType } from "../../../game/Component"
import { Entity } from "../../../game/Entity"
import { Vec2 } from "../../../game/Math"
import { SystemRegistry } from "../../../game/System"
import { Observer } from "../../../game/util"

import { TeamID } from "../../../game/components/Team"
import { Items } from "../../../game/components/Items"

import { GridSystem } from "../../../game/systems/GridSystem"

export class MyTurnUIState extends Observer<UIStateEvent> implements GameUIState {
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
    private readonly _onDeploy = this.onDeploy.bind(this);
    private readonly _onEndTurn = this.onEndTurn.bind(this);
    private readonly _onHangerSelected = this.onHangerSelected.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);
    private readonly _onItem = this.onItem.bind(this);
    private readonly _onMove = this.onMove.bind(this);

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
        const grid_system = this._systems.lookup(GridSystem);
        const status = grid_system.occupancyStatus(hex);

        if (status != "free" && status != "unknown") {
            this._view.showEntityInfo(status);
            this._view.clearHexStyles();
            this._view.setHexStyle(hex, HexStyle.SELECTED);
        }
    }
    private onItem(item_data: { entity: Entity, index: number}): void {
        /* Only transition to targeting state if the item requires targets */
        const items = this._game_state.getComponent<Items>(
            item_data.entity, ComponentType.ITEMS);

        if (items == undefined) {
            return;
        }

        if (items.data.items.length <= item_data.index) {
            return;
        }

        if (items.data.items[item_data.index].target == undefined) {
            /* No targets required, emit action */
            const useItem =
                new UseItem(item_data.entity, item_data.index, undefined);
            this.emit("action", useItem);
            return;
        }

        const target = new TargetUIState(this._view, this._systems,
                                         this._friendly, this._game_state,
                                         item_data);
        this.emit("change state", target);
    }
    private onMove(entity: Entity): void {
        const move =
            new MoveUIState(this._view, this._systems, this._friendly,
                            this._game_state, entity);
        this.emit("change state", move);
    }
}
