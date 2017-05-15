/**
 * @file client/js/desktop/UI.ts
 * Common UI constants and classes
 */

import { Vec2 } from "../../../game/Math"
import { LOG } from "../../../game/util"

import * as PIXI from "pixi.js"

export class FrameSprite extends PIXI.Sprite {
    constructor(frame: string) {
        super(PIXI.Texture.fromFrame(frame));
    }
}

export const Style = {
    text: {
        normal: new PIXI.TextStyle({
            fontFamily: "Droid Sans",
            fontSize: 14,
            fill: "#FFFFFF",
        }),
        header: new PIXI.TextStyle({
            fontFamily: "Droid Sans",
            fontSize: 14,
            fontWeight: "bold",
            fill: "#FFFFFF",
        }),
        button: new PIXI.TextStyle({
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
        })
    },
    colors: {
        white: { num: 0xFFFFFF, str: "#FFFFFF" },
        green: { num: 0xB5FF83, str: "#B5FF83" },
        yellow: { num: 0xFFDD56, str: "#FFDD56" }
    }
};

export class Label extends PIXI.Container {
    public readonly label: PIXI.Text;

    constructor(icon: string | undefined, label: string, style: PIXI.TextStyle,
                pos: Vec2) {
        super();
        this.x = pos.x;
        this.y = pos.y;


        if (icon != undefined)
        {
            const icon_sprite = new FrameSprite(icon);

            icon_sprite.anchor.x = 0.5;
            icon_sprite.anchor.y = 0.5;
            icon_sprite.x = 7.5;
            icon_sprite.y = 7.5;
            this.addChild(icon_sprite);
        }

        this.label = new PIXI.Text(label, style);
        this.label.y = 0;
        this.label.x = (icon == undefined) ? 0 : 20;

        this.addChild(this.label);
    }
}

export class Resource extends PIXI.Container {
    private graphics: PIXI.Graphics;
    private draw_width: number;
    private percent: number;
    private color: number;

    constructor(icon: string, width: number, color: number = 0xFFFFFF,
                percent: number = 1.0) {
        super();

        this.height = 15;
        this.draw_width = width;
        this.percent = percent;
        this.color = color;

        /* Draw the sprite. This doesn't change */
        const icon_sprite = new FrameSprite(icon);
        icon_sprite.anchor.x = 0.5;
        icon_sprite.anchor.y = 0.5;
        icon_sprite.x = 7.5;
        icon_sprite.y = 7.5;

        this.graphics = new PIXI.Graphics();
        this.addChild(icon_sprite, this.graphics);

        this.setPercent(percent);
        this.setColor(color);
        this.redraw();
    }

    public setPercent(percent: number): void {
        if (percent < 0) {
            LOG.WARN("Resource with percent < 0");
            percent = 0;
        } else if (percent > 1.0) {
            LOG.WARN("Resource with percent > 1");
            percent = 1;
        }

        this.percent = percent;
        this.redraw();
    }

    public setColor(color: number): void {
        if (color < 0 || color > 0xFFFFFF) {
            LOG.WARN("Resource with invalid color 0x" + color.toString(16));
            color = 0;
        }

        this.color = color;
        this.redraw();
    }

    private redraw(): void {
        this.graphics.clear();
        this.graphics.lineStyle(1, this.color, 1);
        this.graphics.beginFill(this.color, 0.15);
        this.graphics.drawRoundedRect(20, 0, this.draw_width, 15, 7.5);
        this.graphics.endFill();

        this.graphics.lineStyle(0, 0, 0);
        this.graphics.beginFill(this.color, 1);
        this.graphics.drawRoundedRect(23, 3, this.percent*(this.draw_width - 6),
                                      9, 5);
        this.graphics.endFill();
    }
}
