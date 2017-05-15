/**
 * @file client/js/desktop/GameScreen.ts
 * Describes the scene the user sees when playing the game
 */

import { GameInputHandler } from "./GameInputHandler"
import { TargetWindow } from "./TargetWindow"
import { Grid } from "./Grid"
import { Scene } from "../Scene"
import { LOG } from "../../../game/util"
import { PlayerID } from "../../../game/Player"
import { GlobalState } from "../../../game/GlobalState"

let state = new GlobalState();

export class GameScreen extends Scene {
    private readonly input_handler: GameInputHandler;
    private readonly target_window: TargetWindow;
    private readonly grid: Grid;

    constructor(input_handler: GameInputHandler, friendly: PlayerID,
                state: GlobalState) {
        super();

        this.input_handler = input_handler;
        this.target_window = new TargetWindow(this.input_handler, ship);
        this.target_window.x = 0;
        this.target_window.y = 1080 - this.target_window.height;

        this.grid = new Grid(state.grid, friendly, this.input_handler);
        this.grid.x = 1920 / 2;
        this.grid.y = 1080 / 2;
    }

    public enter(stage: PIXI.Container, callback: () => void): void {
        stage.addChild(this.target_window);
        stage.addChild(this.grid);

        callback();
    }

    public render(delta: number): void {
        this.grid.render();
    }
}
