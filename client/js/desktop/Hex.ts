/**
 * @file client/js/desktop/HexState.ts
 */

import { Canvas, CanvasStyle } from "../Canvas"
import { Entity, EntityID } from "../../../game/Entity"
import { GlobalState } from "../../../game/GlobalState"
import { Vec2 } from "../../../game/Math"
import { PlayerID } from "../../../game/Player"
import { Team } from "../../../game/components/Team"

/**
 * Renders the logic for rendering a single hexagon tile to the screen
 */
export class Hex {
    static readonly SIZE: number = 100;
    private static readonly BORDER_STYLE: CanvasStyle =
        new CanvasStyle("white", "black", 2);
    private static readonly INNER_FRIENDLY: CanvasStyle =
        new CanvasStyle("blue", "blue", 0);
    private static readonly INNER_ENEMY: CanvasStyle =
        new CanvasStyle("red", "red", 0);
    private static readonly HEX_VERTS: Vec2[] = [
        new Vec2(Math.cos(0 * Math.PI / 3), Math.sin(0 * Math.PI / 3)),
        new Vec2(Math.cos(1 * Math.PI / 3), Math.sin(1 * Math.PI / 3)),
        new Vec2(Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3)),
        new Vec2(Math.cos(3 * Math.PI / 3), Math.sin(3 * Math.PI / 3)),
        new Vec2(Math.cos(4 * Math.PI / 3), Math.sin(4 * Math.PI / 3)),
        new Vec2(Math.cos(5 * Math.PI / 3), Math.sin(5 * Math.PI / 3)),
    ];
    /**
     * Location of the hex in axial (hex) coordinates
     * @type {Vec2}
     */
    readonly hex_pos: Vec2;
    /**
     * Location of the hex in pixel coordinates
     * @type {Vec2}
     */
    readonly pixel_pos: Vec2;
    /**
     * Coordinates of this hex's border points
     * @type {Vec2[]}
     */
    readonly border: Vec2[];
    /**
     * Coordinates of this hex's inner-hex border
     * @type {Vec2[]}
     */
    readonly inner_hex: Vec2[];
    /**
     * Coordinates of this hex's status ring inner border
     */
    readonly status_hex: Vec2[];
    /**
     * Player that is considered friendly
     * @type {PlayerID}
     */
    readonly friendly: PlayerID;
    /**
     * Most recent game state
     * @type {GameState}
     */
    private state: GlobalState;
    /**
     * Render style
     */
    private render_style: "normal" | "target" | "selected";

    constructor(hex_pos: Vec2, friendly: PlayerID, state: GlobalState) {
        this.hex_pos = hex_pos;
        this.friendly = friendly;
        this.render_style = "normal";
        this.state = state;

        /* Convert hex coordinates to pixel coordinates */
        const pixel_x = Hex.SIZE * 1.5 * hex_pos.x;
        const pixel_y = Hex.SIZE * Math.sqrt(3) * (hex_pos.y + 0.5 * hex_pos.x);

        this.pixel_pos = new Vec2(pixel_x, pixel_y);

        /* Transform the unit hex to be the hex making up our border */
        let border_tmp: Vec2[] = [];
        let inner_tmp: Vec2[] = [];
        let inner_status_tmp: Vec2[] = [];

        for (let vert of Hex.HEX_VERTS) {
            border_tmp.push(vert.scale(Hex.SIZE).add(this.pixel_pos));
            inner_tmp.push(vert.scale(0.60 * Hex.SIZE).add(this.pixel_pos));
            inner_status_tmp.push(vert.scale(0.75 * Hex.SIZE).add(this.pixel_pos));
        }

        this.border = border_tmp;
        this.inner_hex = inner_tmp;
        this.status_hex = inner_status_tmp;
    }
    /**
     * Set the render style for the hex
     */
    setRenderStyle(style: "normal" | "target" | "selected") {
        this.render_style = style;
    }
    /**
     * Render the hex in this state
     * @param  {number} timestamp Time being renderered
     * @param  {Canvas} canvas    Canvas being rendered to
     */
    render(timestamp: number, canvas: Canvas): void {
        canvas.setStyle(Hex.BORDER_STYLE);
        canvas.drawPath(this.border);

        if (this.render_style == "normal") {
            canvas.setStyle(new CanvasStyle("white", "black", 2));
        } else if (this.render_style == "target") {
            canvas.setStyle(new CanvasStyle("white", "rgba(0, 0, 255, 0.75)", 2));
        } else if (this.render_style == "selected") {
            canvas.setStyle(new CanvasStyle("white", "rgba(255, 255, 255, 0.5)", 2));
        }

        canvas.drawPath(this.border);
    }
/*
    renderEntity(entity: Entity, canvas: Canvas) {
        const team = entity.getComponent(Team);
        if (team == null) {

        } else if (team.team == this.friendly) {
            canvas.setStyle(Hex.INNER_FRIENDLY);
        } else {
            canvas.setStyle(Hex.INNER_ENEMY);
        }

        if (entity.getComponent(Pilot) != null) {
            canvas.drawPath(this.inner_hex);
        } else {
            canvas.drawPath([
                this.inner_hex[0].lerp(this.inner_hex[5], 0.75),
                this.inner_hex[3].lerp(this.inner_hex[4], 0.75),
                this.inner_hex[3].lerp(this.inner_hex[2], 0.75),
                this.inner_hex[0].lerp(this.inner_hex[1], 0.75)
            ]);
        }

        const health = entity.getComponent(Health);

        if (health != null) {
            let health_style = new CanvasStyle("green", "green", 0);
            const health_percent = health.current_health / health.max_health;
            const health_verts = this.statusArc(2, 3, 4, health_percent);
            canvas.setStyle(health_style);
            canvas.drawPath(health_verts);
        }

        const charge = entity.getComponent(Charge);

        if (charge != null) {
            const energy_percent = charge.current_charge / charge.max_charge;
            const energy_verts = this.statusArc(1, 0, 5, energy_percent);

            let energy_style = new CanvasStyle("yellow", "yellow", 0);
            canvas.setStyle(energy_style);
            canvas.drawPath(energy_verts);
        }
    }

    private statusArc(low: number, mid: number, high: number, p: number):
        Vec2[] {
            if (p == 0) return [];

            let verts: Vec2[] = [ this.status_hex[low], this.border[low] ];

            if (p > 0.5) {
                verts.push(this.border[mid]);

                const norm = (p - 0.5) / 0.5;
                const outer = this.border[mid].lerp(this.border[high], norm);
                const inner = this.status_hex[mid].lerp(this.status_hex[high], norm);

                verts = verts.concat([outer, inner, this.status_hex[mid]]);
                return verts;
            }

            const norm = 2 * p;
            const outer = this.border[low].lerp(this.border[mid], norm);
            const inner = this.status_hex[low].lerp(this.status_hex[mid], norm);

            verts = verts.concat([outer, inner]);
            return verts;
    }*/
}
