/**
 * @file game/GameData.ts
 * Reads the data JSON files and saves them
 */
let jsonfile = require("jsonfile");

export const items: any = require("./data/items.json");
export const constants: any = require("./data/constants.json");
