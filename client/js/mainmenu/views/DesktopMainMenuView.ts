/**
 * @file client/js/desktop/MainMenu.ts
 * Describes the main menu scene a user sees once they're logged in
 */

import { MainMenuView, MainMenuInteractionEvent } from "../MainMenuView"

import { Scene } from "../../Scene"
import { Style, FrameSprite } from "../../UI"

import { Observer, LOG } from "../../../../game/util"

import * as PIXI from "pixi.js"

const TEXT_X = 25;
const TEXT_Y = 260;
const TEXT_MAX_WIDTH = 234;
const TEXT_MAX_HEIGHT = 255;
const STATUS_STYLE = new PIXI.TextStyle({
    fontFamily: "Droid Sans",
    fontSize: 14,
    fill: "#FFFFFF",
    wordWrap: true,
    wordWrapWidth: TEXT_MAX_WIDTH
});

function createButton(y: number, color: string, label: string,
                      click_handler: () => void): PIXI.Container {
    let button = new FrameSprite(color + '_menu_button.png');
    button.x = 12;
    button.y = y;
    button.interactive = true;
    button.buttonMode = true;
    button.on('click', click_handler);

    let label_item = new PIXI.Text(label, Style.text.button);
    label_item.anchor.x = 0.5;
    label_item.anchor.y = 0.5;
    label_item.x = 128;
    label_item.y = 23;

    button.addChild(label_item);

    return button;
}

export class DesktopMainMenuView extends Observer<MainMenuInteractionEvent> implements MainMenuView {
    private readonly _menu: FrameSprite;
    private readonly _text_container: PIXI.Container;

    /* Array of timestamped messages to display in the text section of the
     * MainMenu UI
     */
    private _text: [Date, string][] = [];

    constructor() {
        super();

        /* Setup layout */
        this._menu = new FrameSprite("main_menu_frame.png");
        this._menu.x = 20;
        this._menu.y = 540;

        this._menu.addChild(createButton(12, "blue", "PLAY", () => {
            this.emit("play");
        }));
        this._menu.addChild(createButton(72, "green", "MY FLEET", () => {
            console.log("FLEET");
        }));
        this._menu.addChild(createButton(132, "grey", "STATS", () => {
            console.log("STATS");
        }));
        this._menu.addChild(createButton(192, "grey", "SETTINGS", () => {
            console.log("SETTINGS");
        }));

        this._text_container = new PIXI.Container();
        this._text_container.x = TEXT_X;
        this._text_container.y = TEXT_Y;

        this._menu.addChild(this._text_container);
    }
    public enter(stage: PIXI.Container, callback: () => void): void {
        stage.addChild(this._menu);

        callback();
    }
    public exit(callback: () => void): void {
        return callback();
    }
    public render(delta: number) {
    }
    /**
     * Add a message to the text box
     *
     * @param {string} msg String to append
     */
    public displayNotification(msg: string): void {
        this._text_container.removeChildren();

        this._text.unshift([new Date(), msg]);

        /* While we haven't exceeded the height of the text box, add messages
         * and their timestamps. Newest at the top
         */
        let current_height = 0;
        let i = 0;

        while (true) {
            const [date, str] = this._text[i];

            /* TODO: Pad hours and minutes with 0s on the left */
            const formatted = "[" + date.getHours().toString() + ":" +
                              date.getMinutes().toString() + "] " + str;
            const metrics =
                PIXI.TextMetrics.measureText(formatted, STATUS_STYLE);

            /* Stop if adding this next string would cause us to overflow */
            if (current_height + metrics.height > TEXT_MAX_HEIGHT) {
                break;
            }

            const text = new PIXI.Text(formatted, STATUS_STYLE);
            text.x = 0;
            text.y = current_height;

            this._text_container.addChild(text);

            current_height += metrics.height;

            /* Stop if this was the last message */
            i++;

            if (i >= this._text.length) {
                break;
            }
        }

        /* Remove any messages that aren't being displayed anymore */
        while (i < this._text.length) {
            this._text.pop();
            i++;
        }
    }
}
