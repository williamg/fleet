/**
 * @file client/js/Scene.ts
 * Defines a particular scene of the game. For example, the main menu is one
 * scene and the in game view is another scene.
 */

import * as PIXI from "pixi.js"

export abstract class Scene {
    constructor() {
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
}
