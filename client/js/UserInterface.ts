/**
 * @file client/js/UserInterface.ts
 * Takes care of managing the canvas and updating the scene as appropriate
 */

import * as  PIXI from "pixi.js"
import { LOG } from "../../game/util"
import { Scene } from "./Scene"
import { MainMenu } from "./desktop/MainMenu"

const WIDTH: number = 1920;
const HEIGHT: number = 1080;

export class UserInterface {
    /**
     * Current scene being displayed
     */
    private scene: Scene;
    /**
     * Stage for the current scene to render in
     */
    private scene_stage: PIXI.Container;
    /**
     * Asset loader
     */
    private readonly loader: PIXI.loaders.Loader = PIXI.loader;

    /**
     * Pixi context
     */
    private readonly app: PIXI.Application;

    constructor(callback: () => void) {
        /* Initialize PIXI */
        this.app = new PIXI.Application(WIDTH, HEIGHT);
        document.body.appendChild(this.app.view);
        this.handleResize(window.innerWidth, window.innerHeight);

        /* Install resize handler */
        window.onresize = (e) => {
           this.handleResize(window.innerWidth, window.innerHeight);
        }

        /* Load assets */
        this.loader.add('assets/ui/ui.json').load(() => {
            LOG.INFO("Finished loading textures");

            this.scene = new MainMenu();

            /* Initialize scene */
            this.scene_stage = new PIXI.Container();
            this.scene_stage.width = WIDTH;
            this.scene_stage.height = HEIGHT;
            this.app.stage.addChild(this.scene_stage);
            this.scene.enter(this.scene_stage, callback);

            this.app.ticker.add((delta: number) => {
                this.scene.render(delta);
            });
       });
    }

    /**
     * Transition to a new scene
     *
     * @param scene Scene being transition to
     * @param callback Callback to call once the new scene is finished entering
     */
    public setScene(scene: Scene, callback: () => void): void {
        scene.exit(() => {
            this.app.stage.removeChild(this.scene_stage);
            this.scene = scene;
            this.scene_stage = new PIXI.Container();
            this.app.stage.addChild(this.scene_stage);
            scene.enter(this.scene_stage, callback);
        });
    }

    /**
     * Handle the window being resized
     *
     * @param width New width
     * @param height New height
     */
    private handleResize(width: number, height: number): void {
        const current_aspect = width / height;
        const desired_aspect = WIDTH / HEIGHT;

        if (current_aspect > desired_aspect) {
            const new_width = height * desired_aspect;

            this.app.view.style.height = height.toString() + "px";
            this.app.view.style.width = new_width.toString() + "px";
            this.app.view.style.left = ((width - new_width) / 2).toString() + "px";
            this.app.view.style.top = "0px";
        } else {
            const new_height = width / desired_aspect;

            this.app.view.style.height = new_height.toString() + "px";
            this.app.view.style.width = width.toString() + "px";
            this.app.view.style.left = "0px";
            this.app.view.style.top = ((height - new_height) / 2).toString() + "px";
        }
    }
}
