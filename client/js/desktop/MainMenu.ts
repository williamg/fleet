/**
 * @file client/js/desktop/MainMenu.ts
 * Describes the main menu scene a user sees once they're logged in
 */

import { Scene } from "../Scene"

import * as PIXI from "pixi.js"

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

    const style = new PIXI.TextStyle({
        fontFamily: "Droid Sans",
        fontSize: 20,
        fill: "#FFFFFF",
        /* For some reason, drop shadow only works if text is stroked... */
        stroke: "#FFFFFF",
        strokeThickness: 1,
        dropShadow: true,
        dropShadowColor: "#FFFFFF",
        dropShadowBlur: 2,
        dropShadowAngle: 0,
        dropShadowDistance: 0
    });

    let label_item = new PIXI.Text(label, style);
    label_item.anchor.x = 0.5;
    label_item.anchor.y = 0.5;
    label_item.x = 128;
    label_item.y = 23;

    button_container.addChild(image);
    button_container.addChild(label_item);

    return button_container;
}

export class MainMenu extends Scene {
    private menu: PIXI.Container;

    constructor() {
        super();
    }

    public enter(stage: PIXI.Container, callback: () => void): void {
        /* Render background image */
        //let bg_sprite = PIXI.Sprite.fromImage('assets/ui/background.png');

        //stage.addChild(bg_sprite);

        /* Setup menu */
        let menu = new PIXI.Container();
        menu.x = 20;
        menu.y = 540;

        let menu_sprite = new PIXI.Sprite(PIXI.Texture.fromFrame('main_menu_frame.png'));
        menu.addChild(menu_sprite);

        stage.addChild(menu);

        menu.addChild(createButton(12, "blue", "PLAY", () => {console.log("PLAY");}));
        menu.addChild(createButton(72, "green", "MY FLEET", () => {console.log("FLEET");}));
        menu.addChild(createButton(132, "grey", "STATS", () => {console.log("STATS");}));
        menu.addChild(createButton(192, "grey", "SETTINGS", () => {console.log("SETTINGS");}));

        callback();
    }

    public render(delta: number): void
    {

    }
}
