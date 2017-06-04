/**
 * @file game/GameSystems.ts
 * Dictionary of all the systems need to run the game logic
 */

import { DeploySystem } from "./systems/DeploySystem"
import { GridSystem } from "./systems/GridSystem"

export interface GameSystems {
    readonly deploy: DeploySystem;
    readonly grid: GridSystem;
};
