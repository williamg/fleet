/**
 * @file client/js/mainmenu/MainMenuView.ts
 * Describes a generic interface all main menu views must implement
 */
import { Observer } from "../../../game/util"

import * as PIXI from "pixi.js"

export type MainMenuInteractionEvent = "play"

export interface MainMenuView extends Observer<MainMenuInteractionEvent> {
    /**
     * Bring the view into view
     *
     * @param {PIXI.Container} container Container to use for rendering
     * @param {() => void}     callback  Function to call once finished
     */
    enter(container: PIXI.Container, callback: () => void): void;
    /**
     * Bring the view out of view
     *
     * @param {() => void} callback Function to call once finished
     */
    exit(callback: () => void): void;
    /**
     * Render the view
     *
     * @param {number} delta Number of seconds passed since last render
     */
    render(delta: number): void;
    /**
     * Display a notification from the server
     *
     * @param {string} notification String to display
     */
    displayNotification(notification: string): void;
}
