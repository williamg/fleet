/**
 * @file client/js/Scene.ts
 * Defines a particular scene of the game. For example, the main menu is one
 * scene and the in game view is another scene.
 */
import { UserInterface } from "./UserInterface"

import { Observer } from "../../game/util"
import { Message } from "../../game/Message"

import * as PIXI from "pixi.js"

export type SceneEvent = "message"

export abstract class Scene extends Observer<SceneEvent> {
    protected readonly _ui: UserInterface;

    constructor(ui: UserInterface) {
        super();

        this._ui = ui;
    }
    /**
     * Render the scene
     */
    public abstract render(delta: number): void;

    /**
     * Transition this scene into view
     *
     * @param callback Function to call when complete
     */
    public enter(stage: PIXI.Container, callback: () => void): void {
        callback();
    }
    /**
     * Transition this scene out of view
     *
     * @param callback Function to call when complete
     */
    public exit(callback: () => void): void {
        callback();
    }
    /**
     * Handle a message received from the server
     *
     * @param {Message} messsage Message received
     */
    public handleMessage(message: Message): void {}
}
