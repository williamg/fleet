/**
 * @file game/serialization/ActionSerialization.ts
 * Functions for (de)serializing actions
 */

import { Action, ActionType, Move, Deploy } from "../Action"
import { Entity } from "../Entity"
import { Vec2 } from "../Math"

/**
 * Action JSONified
 */
export type ActionJSON = {
    type: ActionType,
    data: string
};

export type MoveJSON = {
    entity: Entity,
    dest: [number, number]
}

export type DeployJSON = {
    entity: Entity,
    deploy: Entity,
    index: number
};
/**
 * Represent the action as a string
 *
 * @param   {Action} action Action to serialize
 * @returns {string}        Serialize match info
 */
export function serializeAction(action: Action): string {
    return JSON.stringify(actionToJSON(action));
}
/**
 * Convert a serialized action into an instance
 *
 * @param  {string} action_str Serialize Action
 * @return {Action}            Action instance
 * @throws {Error}             On invalid serialization input
 */
export function deserializeAction(action_str: string): Action  {
    return actionFromJSON(JSON.parse(action_str));
}
/**
 * Represent action as JSON
 *
 * @param   {Action}     action Action to serialize
 * @returns {ActionJSON}        JSON representation of action
 */
export function actionToJSON(action: Action): ActionJSON {
    let data = "";

    switch (action.type) {
        case ActionType.MOVE:
            data = serializeMove(action as Move);
            break;
        case ActionType.DEPLOY:
            data = serializeDeploy(action as Deploy);
            break;
    }

    return {
        type: action.type,
        data: data
    };
}
/**
 * Convert a JSONified action into an instance
 *
 * @param  {string} action_json JSONified Action
 * @return {Action}             Action instance
 * @throws {Error}              On invalid serialization input
 */
export function actionFromJSON(action_json: ActionJSON): Action {
    switch (action_json.type) {
        case ActionType.MOVE:
            return deserializeMove(action_json.data);
        case ActionType.DEPLOY:
            return deserializeDeploy(action_json.data);
    }

    throw new Error("Unexhaustive action deserialization");
}
/**
 * Represent the move as a string
 *
 * @param   {Move}   move Move to serialize
 * @returns {string}      Serialize move
 */
export function serializeMove(move: Move): string {
    return JSON.stringify(moveToJSON(move));
}
/**
 * Convert a serialized move into an instance
 *
 * @param  {string} move_str Serialize Move
 * @return {Move}            Move instance
 * @throws {Error}           On invalid serialization input
 */
export function deserializeMove(move_str: string): Move  {
    return moveFromJSON(JSON.parse(move_str));
}
/**
 * Represent move as JSON
 *
 * @param   {Move}     move Move to serialize
 * @returns {MoveJSON}      JSON representation of move
 */
export function moveToJSON(move: Move): MoveJSON {
    return {
        entity: move.entity,
        dest: [move.dest.x, move.dest.y]
    };
}
/**
 * Convert a JSONified move into an instance
 *
 * @param  {string} move_json JSONified Move
 * @return {Move}             Move instance
 * @throws {Error}            On invalid serialization input
 */
export function moveFromJSON(move_json: MoveJSON): Move {
    const [x, y] = move_json.dest;
    return new Move(move_json.entity, new Vec2(x, y));
}
/**
 * Represent the deploy as a string
 *
 * @param   {Deploy}   deploy Deploy to serialize
 * @returns {string}          Serialize deploy
 */
export function serializeDeploy(deploy: Deploy): string {
    return JSON.stringify(deployToJSON(deploy));
}
/**
 * Convert a serialized deploy into an instance
 *
 * @param  {string} deploy_str Serialize Deploy
 * @return {Deploy}            Deploy instance
 * @throws {Error}             On invalid serialization input
 */
export function deserializeDeploy(deploy_str: string): Deploy  {
    return deployFromJSON(JSON.parse(deploy_str));
}
/**
 * Represent deploy as JSON
 *
 * @param   {Deploy}     deploy Deploy to serialize
 * @returns {DeployJSON}        JSON representation of deploy
 */
export function deployToJSON(deploy: Deploy): DeployJSON {
    return {
        entity: deploy.entity,
        deploy: deploy.deploy_entity,
        index: deploy.target_index
    };
}
/**
 * Convert a JSONified deploy into an instance
 *
 * @param  {string} deploy_json JSONified Deploy
 * @return {Deploy}             Deploy instance
 * @throws {Error}              On invalid serialization input
 */
export function deployFromJSON(deploy_json: DeployJSON): Deploy {
    return new Deploy(deploy_json.entity,
                      deploy_json.deploy, deploy_json.index);
}
