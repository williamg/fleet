/**
 * @file client/js/game/TargetUIState.ts
 *
 * The UIState for when the player is selecting a target to use an item
 */
import { GameUIState, UIStateEvent } from "./GameUIState"
import { NotMyTurnUIState } from "./NotMyTurnUIState"
import { MyTurnUIState } from "./MyTurnUIState"
import { GameView, CancelPos, HexStyle } from "./GameView"

import { UseItem } from "../../../game/Action"
import { ComponentType } from "../../../game/Component"
import { Entity } from "../../../game/Entity"
import { GameState } from "../../../game/GameState"
import { Vec2 } from "../../../game/Math"
import { SystemRegistry } from "../../../game/System"
import { Observer } from "../../../game/util"

import { TeamID } from "../../../game/components/Team"
import { HexPosition } from "../../../game/components/HexPosition"
import { Items } from "../../../game/components/Items"

import { ItemSystem } from "../../../game/systems/ItemSystem"
import { GridSystem } from "../../../game/systems/GridSystem"

export class TargetUIState extends Observer<UIStateEvent>
    implements GameUIState {
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
     * Item data
     * @type {{entity: Entity, index: number}}
     */
    private readonly _item_data: { entity: Entity, index: number};
    /**
     * Game state
     * @type {GameState}
     */
    private _game_state: GameState;

    /**
     * List of valid targets for the entity
     *
     * @type {Vec2[]}
     */
    private _valid_targets: Vec2[];
    /**
     * Handler references
     */
    private readonly _onCancel = this.onCancel.bind(this);
    private readonly _onEndTurn = this.onEndTurn.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);

    constructor(view: GameView, systems: SystemRegistry, friendly: TeamID,
                game_state: GameState,
                item_data: {entity: Entity, index: number}) {
        super();

        this._view = view;
        this._systems = systems;
        this._friendly = friendly;

        this._item_data = item_data;
        this._valid_targets = [];

        this.setState(game_state);
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

        /* Lookup item */
        const item_comp = state.getComponent<Items>(
            this._item_data.entity, ComponentType.ITEMS)!;
        const item = item_comp.data.items[this._item_data.index];

        const item_system = this._systems.lookup(ItemSystem);
        const grid_system = this._systems.lookup(GridSystem);

        /* Cache targets */
        const targets = [];

        for (const pos of grid_system.index_map) {
            if (!item_system.isValidTarget(this._item_data.entity, item, pos)) {
                continue;
            }

            targets.push(pos);
        }

        this._valid_targets = targets;
    }
    /**
     * @see client/js/game/GameUIState
     */
    public enter(): void {
        this._view.setHangerTargeting(false);
        this._view.setGridTargeting(true);
        this._view.setItems(false);

        switch (this._item_data.index) {
            case 0:
                this._view.setCancelPos(CancelPos.ITEM_1);
                break;
            case 1:
                this._view.setCancelPos(CancelPos.ITEM_2);
                break;
            case 2:
                this._view.setCancelPos(CancelPos.ITEM_3);
                break;
            default:
                throw new Error("Bad item index");
        }

        this._view.addListener("cancel", this._onCancel);
        this._view.addListener("end turn", this._onEndTurn);
        this._view.addListener("hex click", this._onHexSelected);

        /* Highlight potential targets */
        for (const target of this._valid_targets) {
            this._view.setHexStyle(target, HexStyle.TARGET);
        }
    }
    /**
     * @see client/js/game/GameUIState
     */
    public exit(): void {
        this._view.removeListener("cancel", this._onCancel);
        this._view.removeListener("hex click", this._onHexSelected);
        this._view.removeListener("end turn", this._onEndTurn);

        this._view.setCancelPos(CancelPos.HIDDEN);

        this._view.clearHexStyles();
    }
    private onCancel(): void {
        this.emit("change state", new MyTurnUIState(
            this._view, this._systems, this._friendly, this._game_state));
    }
    private onEndTurn(): void {
        this.emit("end turn");
    }
    private onHexSelected(hex: Vec2): void {
        /* Check if the hex is valid */
        const target = this._valid_targets.find((target) => {
            return target.equals(hex);
        });

        if (target == undefined) return;

        const action = new UseItem(this._item_data.entity,
                                   this._item_data.index, target);
        this.emit("action", action);

        /* Once moved, return to normal state */
        this.emit("change state", new MyTurnUIState(
            this._view, this._systems, this._friendly,
            this._game_state));
    }
}
