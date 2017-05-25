/**
 * @file client/js/desktop/GameScreen.ts
 * Describes the scene the user sees when playing the game
 */

import { GameInputHandler } from "./GameInputHandler"
import { TargetWindow } from "./TargetWindow"
import { Grid } from "./Grid"
import { Scene } from "../Scene"
import { LOG } from "../../../game/util"
import { TeamID } from "../../../game/components/Team"
import { GlobalState } from "../../../game/GlobalState"

/* Temporary */
import { newShip, Jumper } from "../../../game/Ship"

export class GameScreen extends Scene {
    private readonly input_handler: GameInputHandler;
    private readonly target_window: TargetWindow;
    private readonly grid: Grid;

    constructor(input_handler: GameInputHandler, friendly: TeamID,
                state: GlobalState) {
        super();

        /* Debug, create new ship */
        const ship = newShip(state, Jumper, "Falcon", friendly, "Han Solo", [2, 2, 2]);

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
