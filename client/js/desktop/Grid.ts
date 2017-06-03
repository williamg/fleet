/**
 * @file client/js/desktop/Grid.ts
 * Renders the ingame grid
 */

import { Style } from "./UI"
import { UIObserver } from "./GameScreen"

import { Vec2 } from "../../../game/Math"
import { LOG, ASSERT } from "../../../game/util"
import { Entity } from "../../../game/Entity"
import { ComponentType } from "../../../game/Component"
import { GameState } from "../../../game/GameState"
import { GridSystem } from "../../../game/systems/GridSystem"

import { HexPosition } from "../../../game/components/HexPosition"
import { DeployZone } from "../../../game/components/DeployZone"
import { Team, TeamID } from "../../../game/components/Team"

import { Map } from "immutable"

import * as PIXI from "pixi.js"

const HEX_SIZE = 60;
const HEX_PADDING = 6;
const HEX_OUTER_SIZE = HEX_SIZE + (HEX_PADDING / 2);

function hexToPixel(hex: Vec2): Vec2 {
    const pixelx = HEX_OUTER_SIZE * 1.5 * hex.x;
    const pixely = HEX_OUTER_SIZE * Math.sqrt(3) * (hex.y + hex.x / 2);

    return new Vec2(pixelx, pixely);
}

function hexRound(coord: Vec2): Vec2 {
    const z = -coord.x - coord.y;

    var rx = Math.round(coord.x);
    var ry = Math.round(z);
    var rz = Math.round(coord.y);
    let tmp = 0;

    const x_diff = Math.abs(rx - coord.x);
    const y_diff = Math.abs(ry - coord.y);
    const z_diff = Math.abs(rz - z);

    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry - rz;
    } else if (y_diff > z_diff) {
        ry = -rz - rx;
    }

    return new Vec2(rx, rz);
}

export type HexStyle = {
    color: number,
    alpha: number
};

export class Grid extends PIXI.Container {
    private readonly _grid: GridSystem;
    private readonly _friendly: TeamID;
    private readonly _graphics: PIXI.Graphics;
    private readonly _observer: UIObserver;
    private _styles: Map<number, HexStyle>

    constructor(grid: GridSystem, observer: UIObserver, friendly: TeamID) {
        super()

        this._grid = grid;
        this._observer = observer;
        this._friendly = friendly;
        this._graphics = new PIXI.Graphics();

        this._styles = Map<number, HexStyle>();
        this.clearHexStyles();

        this.addChild(this._graphics);
        this.interactive = true;

        this.on("mousemove", this.handleMouseMove.bind(this));
        this.on("click", this.handleClick.bind(this));
    }

    public render(state: GameState): void {
        this._graphics.clear();

        for (const [i, status] of this._grid.grid) {
            const loc = this._grid.index_map.get(i)!;
            this.drawHex(loc);

            if (status != "free" && status != "unknown") {
                this.drawEntity(status, state);
            }
        }

    }
    public clearHexStyles(): void {
        for(let i = 0; i < this._grid.index_map.size; ++i) {
            this._styles = this._styles.set(i, { color: 0xFFFFFF, alpha: 0.5 });
        }
    }

    public setHexStyle(hex: Vec2, style: HexStyle): void {
        const index = this._grid.index_map.findIndex(hex.equals.bind(hex));

        ASSERT(index >= 0);

        this._styles = this._styles.set(index, style);
    }

    private drawHex(hex: Vec2) {
        const index = this._grid.index_map.findIndex(hex.equals.bind(hex));

        ASSERT(index >= 0);

        const style = this._styles.get(index)!;
        const pixel = hexToPixel(hex);

        this._graphics.lineStyle(0, 0xFFFFFF, 0);
        this._graphics.beginFill(style.color, style.alpha);
        this._graphics.moveTo(pixel.x + HEX_SIZE, pixel.y);

        for (let i = 1; i <= 6; ++i) {
             const deg = 60 * i;
             const rad = (Math.PI / 180) * deg;

             const cornerx = pixel.x + (HEX_SIZE * Math.cos(rad));
             const cornery = pixel.y + (HEX_SIZE * Math.sin(rad));

             this._graphics.lineTo(cornerx, cornery);
        }
        this._graphics.endFill();
    }

    private drawEntity(entity: Entity, state: GameState) {
        const pos_component =
            state.getComponent<HexPosition>(entity, ComponentType.HEX_POSITION)!;
        const deploy_zone_comp =
            state.getComponent<DeployZone>(entity, ComponentType.DEPLOY_ZONE);
        const team_comp =
            state.getComponent<Team>(entity, ComponentType.TEAM)!;

        ASSERT(pos_component != null);

        const center = hexToPixel(new Vec2(pos_component.data.x,
                                           pos_component.data.y));
        const color = (team_comp.data.team == this._friendly) ? 0x00FF00 : 0xFF0000

        this._graphics.beginFill(color, 1);
        if (deploy_zone_comp) {
            this._graphics.drawCircle(center.x, center.y, 20);
        } else {
            this._graphics.drawRect(-20 + center.x, -20 + center.y, 40, 40);
        }
        this._graphics.endFill();

    }

    private hexFromEvent(event: PIXI.interaction.InteractionEvent): Vec2 {
        const loc = event.data.getLocalPosition(this);

        const hexx = loc.x * (2/3) / HEX_OUTER_SIZE;
        const hexy = ((-loc.x / 3) + (loc.y * Math.sqrt(3)/3)) / HEX_OUTER_SIZE;
        return hexRound(new Vec2(hexx, hexy));
    }

    private handleMouseMove(mouse: PIXI.interaction.InteractionEvent): void {
        const hex = this.hexFromEvent(mouse);

        if (this._grid.inBounds(hex)) {
            /* Handle hex hover */
        }
    }

    private handleClick(mouse: PIXI.interaction.InteractionEvent): void {
        const hex = this.hexFromEvent(mouse);

        if (this._grid.inBounds(hex)) {
            this._observer.emit("hex clicked", hex);
        }
    }

}
