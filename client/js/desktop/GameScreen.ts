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
import { GameState, GameStateChanger } from "../../../game/GameState"
import { Change } from "../../../game/Changes"
import { System } from "../../../game/System"
import { GridSystem } from "../../../game/systems/GridSystem"
import { Messengers } from "../../../game/Messenger"
import { IDPool } from "../../../game/IDPool"

import { List } from "immutable"

export class GameScreen extends Scene {
    private readonly _input_handler: GameInputHandler;
    private readonly _target_window: TargetWindow;
    private readonly _grid: Grid;
    private readonly _systems: System[];
    private readonly _messengers: Messengers = new Messengers();
    private _state: GameState;

    constructor(input_handler: GameInputHandler, friendly: TeamID,
                state: GameState) {
        super();

        this._state = state;

        this._input_handler = input_handler;
        this._target_window = new TargetWindow(this._input_handler, undefined);
        this._target_window.x = 0;
        this._target_window.y = 1080 - this._target_window.height;

        const grid_system = new GridSystem(new IDPool(), this._messengers);
        this._systems = [ grid_system ];

        this._grid = new Grid(grid_system, this._input_handler);
        this._grid.x = 1920 / 2;
        this._grid.y = 1080 / 2;
    }

    public enter(stage: PIXI.Container, callback: () => void): void {
        stage.addChild(this._target_window);
        stage.addChild(this._grid);

        callback();
    }

    public render(delta: number): void {
        this._grid.render(this._state);
    }

    public handleChanges(changeset: List<Change>): void {
        const mutable_state = new GameStateChanger(this._state, this._systems);

        for (const change of changeset) {
            mutable_state.makeChange(change);
        }

        this._state = mutable_state.state;
    }
}
