/**
 * @file client/js/desktop/Grid.ts
 * Renders the ingame grid
 */

import { Style } from "./UI"
import { GameInputHandler } from "./GameInputHandler"
import { Vec2 } from "../../../game/Math"
import { LOG, ASSERT } from "../../../game/util"
import { HexGrid, hexRound } from "../../../game/HexGrid"
import { Entity, EntityID } from "../../../game/Entity"
import { Position } from "../../../game/components/Positioning"
import { Team, TeamID } from "../../../game/components/Team"

import * as PIXI from "pixi.js"

const HEX_SIZE = 60;
const HEX_PADDING = 6;
const HEX_OUTER_SIZE = HEX_SIZE + (HEX_PADDING / 2);

function hexToPixel(hex: Vec2): Vec2 {
    const pixelx = HEX_OUTER_SIZE * 1.5 * hex.x;
    const pixely = HEX_OUTER_SIZE * Math.sqrt(3) * (hex.y + hex.x / 2);

    return new Vec2(pixelx, pixely);
}

export class Grid extends PIXI.Container {
    private readonly grid: HexGrid<EntityID | null>;
    private readonly friendly: TeamID;
    private readonly input_handler: GameInputHandler;
    private readonly graphics: PIXI.Graphics;

    constructor(grid: HexGrid<EntityID | null>, friendly: TeamID,
        input_handler: GameInputHandler) {
        super()

        this.grid = grid;
        this.friendly = friendly;
        this.input_handler = input_handler;

        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
        this.interactive = true;

        this.on("mousemove", this.handleMouseMove.bind(this));
        this.on("click", this.handleClick.bind(this));
    }

    public render(): void {
        this.graphics.clear();

        for (const [coord, entity_id] of this.grid.cells) {
            this.drawHex(coord);

            if (entity_id) {
                this.drawEntity(entity_id);
            }
        }
    }

    private drawHex(coord: Vec2) {
        const pixel = hexToPixel(coord);

        this.graphics.lineStyle(0, 0xFFFFFF, 0);
        this.graphics.beginFill(0xFFFFFF, 0.5);
        this.graphics.moveTo(pixel.x + HEX_SIZE, pixel.y);

        for (let i = 1; i <= 6; ++i) {
             const deg = 60 * i;
             const rad = (Math.PI / 180) * deg;

             const cornerx = pixel.x + (HEX_SIZE * Math.cos(rad));
             const cornery = pixel.y + (HEX_SIZE * Math.sin(rad));

             this.graphics.lineTo(cornerx, cornery);
        }
        this.graphics.endFill();
    }

    private drawEntity(entity_id: EntityID) {
        const entity = Entity.getEntity(entity_id)!;

        const team_component = entity.getComponent(Team)!;
        const pos_component = entity.getComponent(Position)!;

        ASSERT(pos_component != null);
        ASSERT(team_component != null);

        const center = hexToPixel(pos_component.position);

        if (team_component.team == this.friendly) {
            this.graphics.beginFill(0x00FF00, 1);
        } else {
            this.graphics.beginFill(0xFF0000, 1);
        }

        this.graphics.drawRect(-20 + center.x, -20 + center.y, 40, 40);
        this.graphics.endFill();

    }

    private hexFromEvent(event: PIXI.interaction.InteractionEvent): Vec2 {
        const loc = event.data.getLocalPosition(this);

        const hexx = (loc.x * Math.sqrt(3)/3 - loc.y / 3) / HEX_OUTER_SIZE;
        const hexy = loc.y * (2/3) / HEX_OUTER_SIZE;
        return hexRound(new Vec2(hexx, hexy));
    }

    private handleMouseMove(mouse: PIXI.interaction.InteractionEvent): void {
        const hex = this.hexFromEvent(mouse);

        if (this.grid.inBounds(hex)) {
            this.input_handler.hexHovered(hex);
        }
    }

    private handleClick(mouse: PIXI.interaction.InteractionEvent): void {
        const hex = this.hexFromEvent(mouse);

        if (this.grid.inBounds(hex)) {
            this.input_handler.hexClicked(hex);
        }
    }

}
