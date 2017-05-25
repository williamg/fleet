/**
 * @file client/js/desktop/MainMenu.ts
 * Describes the main menu scene a user sees once they're logged in
 */

import { Scene } from "../Scene"
import { Style } from "./UI"

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
    let button_container = new PIXI.Container();
    button_container.x = 12;
    button_container.y = y;

    const texture = PIXI.Texture.fromFrame(color + '_menu_button.png');

    let image = new PIXI.Sprite(texture);
    image.interactive = true;
    image.buttonMode = true;
    image.on('click', click_handler);

    let label_item = new PIXI.Text(label, Style.text.button);
    label_item.anchor.x = 0.5;
    label_item.anchor.y = 0.5;
    label_item.x = 128;
    label_item.y = 23;

    button_container.addChild(image);
    button_container.addChild(label_item);

    return button_container;
}

export class MainMenu extends Scene {
    private menu: PIXI.Sprite;
    private text_container: PIXI.Container;

    /* Array of timestamped messages to display in the text section of the
     * MainMenu UI
     */
    private text: [Date, string][] = [];

    constructor() {
        super();
    }

    public enter(stage: PIXI.Container, callback: () => void): void {
        /* Setup menu */
        this.menu =
            new PIXI.Sprite(PIXI.Texture.fromFrame('main_menu_frame.png'));
        this.menu.x = 20;
        this.menu.y = 540;

        this.menu.addChild(
            createButton(12, "blue", "PLAY", () => {console.log("PLAY");}));
        this.menu.addChild(
            createButton(72, "green", "MY FLEET", () => {console.log("FLEET");}));
        this.menu.addChild(
            createButton(132, "grey", "STATS", () => {console.log("STATS");}));
        this.menu.addChild(
            createButton(192, "grey", "SETTINGS", () => {console.log("SETTINGS");}));

        this.text_container = new PIXI.Container();
        this.text_container.x = TEXT_X;
        this.text_container.y = TEXT_Y;

        this.menu.addChild(this.text_container);

        stage.addChild(this.menu);

        callback();
    }

    private clearTextContainer(): void {
        this.menu.removeChild(this.text_container);

        this.text_container = new PIXI.Container();
        this.text_container.x = TEXT_X;
        this.text_container.y = TEXT_Y;

        this.menu.addChild(this.text_container);
    }

    public render() {
    }
    /**
     * Add a message to the text box
     *
     * @param {string} msg String to append
     */
    public appendMessage(msg: string): void {
        this.clearTextContainer();

        this.text.unshift([new Date(), msg]);

        /* While we haven't exceeded the height of the text box, add messages
         * and their timestamps. Newest at the top
         */
        let current_height = 0;
        let i = 0;

        while (true) {
            const [date, str] = this.text[i];

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

            this.text_container.addChild(text);

            current_height += metrics.height;

            /* Stop if this was the last message */
            i++;

            if (i >= this.text.length) {
                break;
            }
        }

        /* Remove any messages that aren't being displayed anymore */
        while (i < this.text.length) {
            this.text.pop();
            i++;
        }
    }
}
