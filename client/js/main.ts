/**
 * @file client/js/main.ts
 * Client entry point
 */

import { startGame } from "./../../game/Game";
import { AIPlayer } from "../../game/Player"
import { WebPlayer } from "./WebPlayer"

let me = new WebPlayer();
let them = new AIPlayer();

startGame([me, them]);
