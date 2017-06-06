/**
 * @class client/js/game/views/DesktopGameView.ts
 * A game view for desktop clients
 */
import { Grid } from "./Grid"
import { HangerWindow } from "./HangerWindow"
import { TargetWindow } from "./TargetWindow"

import { GameInteractionEvent, HexStyle, CancelPos } from "../GameView"

import { UserInterface } from "../../UserInterface"

import { GameState } from "../../../../game/GameState"
import { Vec2 } from "../../../../game/Math"
import { Observer } from "../../../../game/util"
import { Entity } from "../../../../game/Entity"
import { SystemRegistry } from "../../../../game/System"

import { TeamID } from "../../../../game/components/Team"

import * as PIXI from "pixi.js"

export class DesktopGameView extends Observer<GameInteractionEvent> {
    /**
     * The main user interface object
     * @type {UserInterface}
     */
    private readonly _ui: UserInterface;
    /**
     * Game systems registry
     * @type {SystemRegistry}
     */
    private readonly _systems: SystemRegistry;
    /**
     * Friendly team
     * @type {TeamID}
     */
    private readonly _friendly: TeamID;
    /**
     * The grid renderer. Undefined until enter()
     * @type {Grid | undefined}
     */
    private _grid: Grid | undefined;
    /**
     * The hanger renderer. Undefined until enter()
     * @type {HangerWindow | undefined}
     */
    private _hanger_window: HangerWindow | undefined;
    /**
     * The target renderer. Undefined until enter()
     * @type {TargetWindow | undefined}
     */
    private _target_window: TargetWindow | undefined;
    /**
     * Most recent game state
     * @type {GameState}
     */
    private _game_state: GameState;

    constructor (ui: UserInterface, systems: SystemRegistry,
                 friendly: TeamID, state: GameState) {
        super();

        this._ui = ui;
        this._systems = systems;
        this._friendly = friendly;
        this._game_state = state;

        this._grid = undefined;
        this._target_window = undefined;
        this._hanger_window = undefined;
    }
    /**
     * Bring this view into view...heh.
     *
     * @param {PIXI.Container} stage    Stage that this view can be added to
     * @param {() => void}     callback Function to call once complete
     */
    public enter(stage: PIXI.Container, callback: () => void): void {
        /* Initialize UI elements */
        this._grid = new Grid(this._systems, this, this._friendly);
        this._target_window =
            new TargetWindow(this, this._friendly, this._game_state)
        this._hanger_window =
            new HangerWindow(this._ui, this, this._systems, this._friendly,
                             this._game_state);

        this.setState(this._game_state);

        this._grid.x = 1920 / 2;
        this._grid.y = 1080 / 2;

        this._target_window.x = 0;
        this._target_window.y = 1080 - this._target_window.height;

        this._hanger_window.x = 1920 - this._hanger_window.width;
        this._hanger_window.y = 1080 - this._hanger_window.height;

        stage.addChild(this._grid);
        stage.addChild(this._hanger_window);
        stage.addChild(this._target_window);

        return callback();
    }
    /**
     * Remove this view from the screen
     *
     * @param {() => void} callback Function to call once complete
     */
    public exit(callback: () => void): void {
    }
    /**
     * Render the view
     *
     * @param {number} delta Time in seconds since the last call to render
     */
    public render(delta: number): void {
        this._grid!.render(delta, this._game_state);
        this._hanger_window!.render();
    }
    /**
     * Handle an updated game state
     *
     * @param {GameState} state Most recent state of the game
     */
    public setState(state: GameState): void {
        this._game_state = state;

        this._target_window!.setButtonTrayVisible(
            this._game_state.current_team == this._friendly);

        this._hanger_window!.setState(state);
        this._target_window!.setState(state);
    }
    /**
     * Enable or disable targeting of ships in the hanger
     *
     * @param {boolean} enabled Whether or not hanger targeting is enabled
     */
    public setHangerTargeting(enabled: boolean): void {
    }
    /**
     * Enable or disable targeting of ships/cells on the grid
     *
     * @param {boolean} enabled Whether or not grid targeting is enabled
     */
    public setGridTargeting(enabled: boolean): void {
    }
    /**
     * Enable or disable the use of items & movement
     *
     * @param {boolean} enabled Whether or not items/movement is enabled
     */
    public setItems(enabled: boolean): void {
    }
    /**
     * Set the position of the cancel button
     *
     * @param {CancelPos} pos Cancel position
     */
    public setCancelPos(cancel_pos: CancelPos): void {
        this._target_window!.setCancelPos(cancel_pos);
    }
    /**
     * Clear all styles on hexes
     */
    public clearHexStyles(): void {
        this._grid!.clearHexStyles();
    }
    /**
     * Set the style of a hex
     *
     * @param {Vec2}     hex   Position of hex to update
     * @param {HexStyle} style Style to set for hex
     */
    public setHexStyle(hex: Vec2, style: HexStyle): void {
        this._grid!.setHexStyle(hex, style);
    }
    /**
     * Show detailed info about an entity
     *
     * @param {Entity} entity Entity to show info for
     */
    public showEntityInfo(entity: Entity): void {
        this._target_window!.setTarget(entity);
    }
}
