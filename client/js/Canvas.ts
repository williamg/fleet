/**
 * @file client/js/Canvas.ts
 * Canvas wrapper to manage resizing and provide drawing wrappers using custom
 * types
 */

export class CanvasStyle {
    strokeStyle: string;
    fillStyle: string;
    lineWidth: number;

    constructor(strokeStyle: string, fillStyle: string, lineWidth: number) {
        this.strokeStyle = strokeStyle;
        this.fillStyle = fillStyle;
        this.lineWidth = lineWidth;
    }
};

import { Vec2 } from "../../game/Math"

 export class Canvas {
     private canvas: HTMLCanvasElement;
     private ctx: CanvasRenderingContext2D;
     readonly width: number;
     readonly height: number;
     readonly parent: HTMLElement;

     /**
      * Construct a new canvas.
      *
      * @param parent Element in which canvas should be constructed
      * @param width Width of the canvas. This is the width of the internal
      * context NOT the width the canvas is displayed with onscreen, which
      * changes based on the size of the parent element to maintain the desired
      * aspect ratio.
      * @param height Height of the canvas. This is the height of the internal
      * context NOT the height the canvas is displayed with onscreen, which
      * changes based on the size of the parent element to maintain the desired
      * aspect ratio.
      **/
     constructor(parent: HTMLElement, width: number, height: number) {
         this.parent = parent;
         this.width = width;
         this.height = height;
         this.canvas = document.createElement("canvas");
         this.canvas.width = width;
         this.canvas.height = height;
         parent.appendChild(this.canvas);
         this.canvas.style.cssFloat = "left";
         this.ctx = this.canvas.getContext("2d")!;
         this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
         this.handleResize();
     }

     /**
      * Adjust the display size of the canvas to maintain the correct aspect
      * ratio.
      */
     handleResize(): void {
         const max_width = this.parent.clientWidth;
         const max_height = this.parent.clientHeight;
         const width_rat = this.width / max_width;
         const height_rat = this.height / max_height;

         if (height_rat < width_rat) {
             this.canvas.style.width = max_width.toString() + "px";
             this.canvas.style.height =
                (this.height / width_rat).toString() + "px";
         } else {
             this.canvas.style.width =
                (this.width / height_rat).toString() + "px";
            this.canvas.style.height = max_height.toString() + "px";
         }

         this.canvas.style.marginLeft =
            ((max_width - parseInt(this.canvas.style.width)) / 2).toString() + "px";
         this.canvas.style.marginTop =
            ((max_height - parseInt(this.canvas.style.height)) / 2).toString() + "px";

     }

     /**
      * Set the style for the canvas
      * @param {CanvasStyle} style Style
      */
     setStyle(style: CanvasStyle): void {
         this.ctx.strokeStyle = style.strokeStyle;
         this.ctx.fillStyle = style.fillStyle;
         this.ctx.lineWidth = style.lineWidth;
     }

     /**
      * Draw path
      * @param {Vec2[]} points Points to draw. The last will connect to the
      *                        first with a straight line
      */
     drawPath(points: Vec2[]): void {
         if (points.length == 0) return;

         this.ctx.beginPath();
         this.ctx.moveTo(points[0].x, points[0].y);

         for (let p of points) {
             this.ctx.lineTo(p.x, p.y)
         }

         this.ctx.closePath();
         this.ctx.stroke();
         this.ctx.fill();
     }

     /**
      * Convert a pixel in client coordinates to canvas coordinates
      * @param  {Vec2} clientCoord Client position
      * @return {Vec2}             Canvas coordinate
      */
     toCanvasCoords(clientCoord: Vec2): Vec2 {
         /* First translate cursor to canvas coordinates */
        const crect = this.canvas.getBoundingClientRect();
        const cpoint = new Vec2(crect.left + (crect.width / 2),
                                crect.top + (crect.height / 2));
        let pixel = clientCoord.sub(cpoint);

        /* Then scale based on canvas size */
        pixel.x /= crect.width / this.width;
        pixel.y /= crect.height / this.height;

        return pixel;
     }
 }
