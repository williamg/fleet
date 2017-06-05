/**
 * @class client/js/game/GameView
 * A generic  view class. All view implementations must provide this
 * functionality to provide the minimum usable experiecne for players
 */
import { GameState } from "../../../game/GameState"
import { Vec2 } from "../../../game/Math"
import { Observer } from "../../../game/util"
import { Entity } from "../../../game/Entity"

import { TeamID } from "../../../game/components/Team"

import * as PIXI from "pixi.js"

export type GameInteractionEvent = "hex click" | "hanger ship click" | "move" |
    "deploy" | "cancel" | "item" | "end turn";

export enum HexStyle {
    NORMAL,
    HOVERED,
    SELECTED,
    TARGET_SELECTED,
    TARGET
};

export enum CancelPos {
    HIDDEN,
    MOVE,
    ITEM_1,
    ITEM_2,
    ITEM_3
}

export interface GameView extends Observer<GameInteractionEvent> {
    /**
     * Bring this view into view...heh.
     *
     * @param {PIXI.Container} stage    Stage that this view can be added to
     * @param {() => void}     callback Function to call once complete
     */
    enter(stage: PIXI.Container, callback: () => void): void;
    /**
     * Remove this view from the screen
     *
     * @param {() => void} callback Function to call once complete
     */
    exit(callback: () => void): void;
    /**
     * Render the view
     *
     * @param {number} delta Time in seconds since the last call to render
     */
    render(delta: number): void;
    /**
     * Handle an updated game state
     *
     * @param {GameState} state Most recent state of the game
     */
    setState(state: GameState): void;
    /**
     * Enable or disable targeting of ships in the hanger
     *
     * @param {boolean} enabled Whether or not hanger targeting is enabled
     */
    setHangerTargeting(enabled: boolean): void;
    /**
     * Enable or disable targeting of ships/cells on the grid
     *
     * @param {boolean} enabled Whether or not grid targeting is enabled
     */
    setGridTargeting(enabled: boolean): void;
    /**
     * Enable or disable the use of items & movement
     *
     * @param {boolean} enabled Whether or not items/movement is enabled
     */
    setItems(enabled: boolean): void;
    /**
     * Set the position of the cancel button
     *
     * @param {CancelPos} pos Cancel position
     */
    setCancelPos(cancel_pos: CancelPos): void;
    /**
     * Clear all styles on hexes
     */
    clearHexStyles(): void;
    /**
     * Set the style of a hex
     *
     * @param {Vec2}     hex   Position of hex to update
     * @param {HexStyle} style Style to set for hex
     */
    setHexStyle(hex: Vec2, style: HexStyle): void;
    /**
     * Show detailed info about an entity
     *
     * @param {Entity} entity Entity to show info for
     */
    showEntityInfo(entity: Entity): void;
}
