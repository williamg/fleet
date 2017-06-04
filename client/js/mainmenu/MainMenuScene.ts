/**
 * @file client/js/mainmenu/MainMenuScene.ts
 * Describes the main menu scene a user sees once they're logged in
 */
import { MainMenuView } from "./MainMenuView"

import { DesktopMainMenuView } from "./views/DesktopMainMenuView"

import { Scene } from "../Scene"
import { UserInterface } from "../UserInterface"

import { GameScene } from "../game/GameScene"

import { GameState } from "../../../game/GameState"
import { Message, MessageType } from "../../../game/Message"
import { LOG } from "../../../game/util"

import { deserializeMatchInfo } from
    "../../../game/serialization/MatchSerialization"

import * as PIXI from "pixi.js"

export class MainMenuScene extends Scene {
    /**
     * The main menu view
     * @type {MainMenuView}
     */
    private readonly _view: MainMenuView;
    /**
     * Event handlers
     */
    private readonly _onPlay = this.onPlay.bind(this);

    constructor(ui: UserInterface) {
        super(ui);

        this._view = new DesktopMainMenuView();
    }
    /**
     * Handle a message from the server
     * @type {Message} message Message received
     */
    public handleMessage(message: Message): void {
        if (message.type == MessageType.SERVER_STATUS) {
            this._view.displayNotification(message.data);

            /* TEMPORARY */
            this.onPlay();
            return;
        }

        if (message.type == MessageType.MATCH_FOUND) {
            this._view.displayNotification("Match found!");

            /* Extract match info */
            const match_info = deserializeMatchInfo(message.data);
            const game_screen = new GameScene(this._ui, match_info.friendly);
            this._ui.setScene(game_screen, () => {});
            return;
        }

        LOG.WARN(`Unexpected message in MainMenu scene: ${message.type}`);
    }
    /**
     * @see client/js/mainmenu/MainMenuView.ts
     */
    public enter(stage: PIXI.Container, callback: () => void): void {
        this._view.enter(stage, () => {
            this._view.addListener("play", this._onPlay);
        });
    }
    /**
     * @see client/js/mainmenu/MainMenuView.ts
     */
    public render(delta: number) {
        this._view.render(delta);
    }
    /**
     * @see client/js/mainmenu/MainMenuView.ts
     */
    public exit(callback: () => void): void {
        this._view.exit(() => {
            this._view.removeListener("play", this._onPlay);
            callback();
        });
    }
    /**
     * Handle the play button being pressed
     */
    private onPlay(): void {
        const find_match = new Message(MessageType.PLAY_AI_MATCH, "");
        this.emit("message", find_match);
        return;
    }
    
}
