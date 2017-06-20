/**
 * @file client/js/game/MoveUIState.ts
 *
 * The UIState for when the player is moving a ship to a new position
 */
import { GameUIState, UIStateEvent } from "./GameUIState"
import { NotMyTurnUIState } from "./NotMyTurnUIState"
import { MyTurnUIState } from "./MyTurnUIState"
import { GameView, CancelPos, HexStyle } from "./GameView"

import { Move } from "../../../game/Action"
import { ComponentType } from "../../../game/Component"
import { Entity } from "../../../game/Entity"
import { GameState } from "../../../game/GameState"
import { Vec2 } from "../../../game/Math"
import { SystemRegistry } from "../../../game/System"
import { Observer } from "../../../game/util"

import { TeamID } from "../../../game/components/Team"
import { HexPosition } from "../../../game/components/HexPosition"
import { Moveable } from "../../../game/components/Moveable"

import { MovementSystem } from "../../../game/systems/MovementSystem"
import { GridSystem } from "../../../game/systems/GridSystem"

import { Map, List } from "immutable"

type LocationInfo = {
    index: number,
    pos: Vec2,
    cost: number
};

export class MoveUIState extends Observer<UIStateEvent> implements GameUIState {
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
     * The entity being deployed
     * @type {Entity}
     */
    private readonly _moving: Entity;
    /**
     * Game state
     * @type {GameState}
     */
    private _game_state: GameState;

    /**
     * List of valid moves and their costs for the entity
     *
     * @type {LocationInfo[]}
     */
    private _valid_locations: LocationInfo[];
    /**
     * Handler references
     */
    private readonly _onCancel = this.onCancel.bind(this);
    private readonly _onEndTurn = this.onEndTurn.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);

    constructor(view: GameView, systems: SystemRegistry, friendly: TeamID,
                game_state: GameState, moving: Entity) {
        super();

        this._view = view;
        this._systems = systems;
        this._friendly = friendly;

        this._moving = moving;
        this._valid_locations = [];

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

        const movement_system = this._systems.lookup(MovementSystem);
        const grid_system = this._systems.lookup(GridSystem);

        /* Cache targets */
        const cost_map = movement_system.getValidMoves(this._moving);
        const locations = [];

        for (const [index, cost] of cost_map) {
            locations.push({
                index: index,
                cost: cost,
                pos: grid_system.index_map.get(index)!
            });
        }

        this._valid_locations = locations;
    }
    /**
     * @see client/js/game/GameUIState
     */
    public enter(): void {
        this._view.setHangerTargeting(false);
        this._view.setGridTargeting(true);
        this._view.setItems(false);
        this._view.setCancelPos(CancelPos.MOVE);

        this._view.addListener("cancel", this._onCancel);
        this._view.addListener("end turn", this._onEndTurn);
        this._view.addListener("hex click", this._onHexSelected);

        /* Highlight potential targets */
        for (const info of this._valid_locations) {
            this._view.setHexStyle(info.pos, HexStyle.TARGET);
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
        const info = this._valid_locations.find((info) => {
            return info.pos.equals(hex);
        });

        if (info == undefined) return;

        const action = new Move(this._moving, info.pos);
        this.emit("action", action);

        /* Once moved, return to normal state */
        this.emit("change state", new MyTurnUIState(
            this._view, this._systems, this._friendly,
            this._game_state));
    }
}
