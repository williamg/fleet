/**
 * @file client/js/GUI.ts
 * Constants for the UI
 */

import { Vec2 } from "../../game/Math"

const GRID_SIZE = 10;
const CWIDTH = 1920;
const CHEIGHT = 1080;
const SHIP_INFO_WIDTH = 104 * GRID_SIZE;
const SHIP_INFO_HEIGHT = 25 * GRID_SIZE;

export class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export const colors = {

};

export const layout = {
    GRID_SIZE: GRID_SIZE,
    CANVAS_WIDTH: CWIDTH,
    CANVAS_HEIGHT: CHEIGHT,
    GRID_CENTER: new Vec2(CWIDTH / 2, CHEIGHT / 2),
    HANGER_LIST: new  Rectangle(GRID_SIZE, GRID_SIZE, 25 * GRID_SIZE,
                                CHEIGHT - 2 * GRID_SIZE),
    SHIP_INFO: new Rectangle((CWIDTH - SHIP_INFO_WIDTH) / 2,
                             CHEIGHT - SHIP_INFO_HEIGHT - GRID_SIZE,
                             SHIP_INFO_WIDTH, SHIP_INFO_HEIGHT)
};
