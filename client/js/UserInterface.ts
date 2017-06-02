/**
 * @file client/js/UserInterface.ts
 * Takes care of managing the canvas and updating the scene as appropriate
 */


import { Scene } from "./Scene"
import { MainMenu } from "./desktop/MainMenu"
import { Action } from "../../game/Action"
import { Message } from "../../game/Message"
import { Vec2 } from "../../game/Math"
import { LOG } from "../../game/util"
import * as  PIXI from "pixi.js"

const WIDTH: number = 1920;
const HEIGHT: number = 1080;

export type MessageCB = (message: Message) => void;
export type TransitionCB = () => void;

export class UserInterface {
    /**
     * Pixi context
     * @type {PIXI.Application}
     */
    public readonly app: PIXI.Application;
    /**
     * Callback to send a message to the server
     * @type {MessageCB}
     */
    private readonly _sendMessage: MessageCB;
    /**
     * Current scene being displayed
     * @type {Scene}
     */
    private _scene: Scene;
    /**
     * Stage for the current scene to render in
     * @type {PIXI.Container}
     */
    private _scene_stage: PIXI.Container;
    /**
     * Initialize the user interface
     *
     * @param {MessageCB}    sendMessage Callback to send message
     * @param {TransitionCB} entered     Callback when finished entering
     */
    constructor(sendMessage: MessageCB, entered: TransitionCB) {
        this._sendMessage = sendMessage;

        /* Initialize PIXI */
        this.app = new PIXI.Application(WIDTH, HEIGHT);
        document.body.appendChild(this.app.view);
        this.handleResize(window.innerWidth, window.innerHeight);

        window.onresize = (e) => {
           this.handleResize(window.innerWidth, window.innerHeight);
        }

        /* Display scene */
        this._scene = new MainMenu(this, this._sendMessage);

        this._scene_stage = new PIXI.Container();
        this._scene_stage.width = WIDTH;
        this._scene_stage.height = HEIGHT;
        this.app.stage.addChild(this._scene_stage);
        this._scene.enter(this._scene_stage, entered);

        this.app.ticker.add((delta: number) => {
            this._scene.render(delta);
        });
    }
    /**
     * Handle a message received from the server
     *
     * @param message {Message} Message received from server
     */
    public handleMessage(message: Message): void {
        this._scene.handleMessage(message);
    }
    /**
     * Transition to a new scene
     *
     * @param scene Scene being transition to
     * @param callback Callback to call once the new scene is finished entering
     */
    public setScene(scene: Scene, callback: () => void): void {
        scene.exit(() => {
            this.app.stage.removeChild(this._scene_stage);
            this._scene = scene;
            this._scene_stage = new PIXI.Container();
            this.app.stage.addChild(this._scene_stage);
            scene.enter(this._scene_stage, callback);
        });
    }
    public toCanvasCoords(x: number, y: number): Vec2 {
        const xc = WIDTH * (x - parseInt(this.app.view.style.left as string)) /
            parseInt(this.app.view.style.width as string);
        const yc = HEIGHT * (y - parseInt(this.app.view.style.top as string)) /
            parseInt(this.app.view.style.height as string);

        return new Vec2(xc, yc);
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
            this.app.view.style.left =
                ((width - new_width) / 2).toString() + "px";
            this.app.view.style.top = "0px";
        } else {
            const new_height = width / desired_aspect;

            this.app.view.style.height = new_height.toString() + "px";
            this.app.view.style.width = width.toString() + "px";
            this.app.view.style.left = "0px";
            this.app.view.style.top =
                ((height - new_height) / 2).toString() + "px";
        }
    }
}
