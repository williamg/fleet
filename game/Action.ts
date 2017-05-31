/**
 * @file game/Action.ts
 */
import { Entity } from "./Entity"
import { GameStateChanger } from "./GameState"
import { Messengers } from "./Messenger"
import { UpdateComponent } from "./Changes"
import { Vec2 }  from "./Math"

import { ComponentType } from "./Component"
import { HexPosition } from "./components/HexPosition"

/**
 * Type of action
 */
export enum ActionType {
    MOVE,
};
/*
 * Actions are the primary interface betwene player and game. Each player's turn
 * consists exclusively of performing some number of actions.
 */
export abstract class Action {
    /**
     * Type of action
     * @type {ActionType}
     */
    readonly type: ActionType;

    constructor(type: ActionType) {
        this.type = type;
    }
    /**
     * Execute an action
     * @param {GameStateChanger} changer    Current state changer
     * @param {Messengers}       messengers Messengers object
     */
    public abstract execute(state: GameStateChanger, messengers: Messengers):
        void;
};
/**
 * Move an entity from one cell to another
 */
export class Move extends Action {
    /**
     * Entity being moved
     * @type {Entity}
     */
    public readonly entity: Entity;
    /**
     * Location to which the ship is being moved
     * @type {[number, number]}
     */
    public readonly dest: Vec2;

    constructor(entity: Entity, dest: Vec2) {
        super(ActionType.MOVE);

        this.entity = entity;
        this.dest = dest;
    }

    public execute(changer: GameStateChanger, messengers: Messengers): void {
        let pos = changer.state.getComponent<HexPosition>(
            this.entity, ComponentType.HEX_POSITION);

        if (pos == undefined) return;

        const old_pos = new Vec2(pos!.data.x, pos!.data.y);

        /* Announce that we're about to move the entity */
        const res = messengers.beforeMove.publish({
            entity: this.entity,
            to: this.dest
        }, changer);

        /* If everyone's okay with us moving the entity, move it, and then tell
         * everyone we moved it
         */
        if (res) {
            pos = pos.with({ x: this.dest.x, y: this.dest.y });

            changer.makeChange(new UpdateComponent(pos));

            messengers.afterMove.publish({
                entity: this.entity,
                from: old_pos
            }, changer);
        }
    }
}

