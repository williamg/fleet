/**
 * @file client/js/desktop/GameInputHandler.ts
 * Handles ALL in game user input, and updates the GUI accordingly
 */

import { Vec2 } from "../../../game/Math"
import { Entity } from "../../../game/Entity"
import { LOG } from "../../../game/util"
import * as PIXI from "pixi.js"

export class GameInputHandler extends PIXI.Container {
    private readonly _app: PIXI.Application;

    constructor(app: PIXI.Application) {
        super();

        this._app = app;

        this._app.view.addEventListener("wheel", (e: WheelEvent) => {
            this.emit("wheel", e);
        });
    }

    public toCanvasCoords(x: number, y: number): Vec2 {
        const xc = 1920 * (x - parseInt(this._app.view.style.left as string)) /
            parseInt(this._app.view.style.width as string);
        const yc = 1080 * (y - parseInt(this._app.view.style.top as string)) /
            parseInt(this._app.view.style.height as string);

        return new Vec2(xc, yc);
    }

    public hangerShipHovered(entity: Entity, e: PIXI.interaction.InteractionEvent) {
        this.emit("hanger ship hover", {
            entity: entity,
            event: e.data.originalEvent
        });
    }

    public hangerShipClicked(entity: Entity, e: PIXI.interaction.InteractionEvent) {
        this.emit("hanger ship click", {
            entity: entity,
            event: e.data.originalEvent
        });
    }
/*
    public itemButtonClick(item: Item) {
        LOG.DEBUG("Item '" + item.name + "' click");
    }*/

    public moveButtonClick(entity: Entity) {
        LOG.DEBUG("Move button");
    }

    public hexHovered(coord: Vec2) {
        LOG.DEBUG(`Hex hovered: (${coord.x}, ${coord.y})`);
    }

    public hexClicked(coord: Vec2) {
        LOG.DEBUG(`Hex clicked: (${coord.x}, ${coord.y})`);
    }
}
