/**
 * @file client/js/desktop/GameInputHandler.ts
 * Handles ALL in game user input, and updates the GUI accordingly
 */

import { Vec2 } from "../../../game/Math"
import { Entity } from "../../../game/Entity"
import { LOG } from "../../../game/util"

export class GameInputHandler extends PIXI.Container {
    constructor() {
        super();
    }

/*    public itemButtonClick(item: Item) {
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
