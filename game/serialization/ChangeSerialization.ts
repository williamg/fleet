/**
 * @file game/serialization/ChangeSerialization.ts
 * Functions for (de)serializing changes
 */

import { Change, ChangeType, StartGame, CreateEntity, DestroyEntity,
         UpdateComponent, DetachComponent, AttachComponent, EndTurn }
    from "../Changes"
import { Entity } from "../Entity"
import { Component } from "../Component"
import { ComponentJSON, componentToJSON, componentFromJSON }
    from "./ComponentSerialization"
import { ASSERT } from "../util"
import { List } from "immutable"

/**
 * Change JSONified
 */
export type ChangeJSON = {
    type: ChangeType,
    entity?: Entity,
    component?: ComponentJSON
};

export type ChangesetJSON = ChangeJSON[];

/**
 * Represent the change as a string
 *
 * @param   {Change} change Change to serialize
 * @returns {string}        Serialize match info
 */
export function serializeChange(change: Change): string {
    return JSON.stringify(changeToJSON(change));
}
/**
 * Convert a serialized change into an instance
 *
 * @param  {string} change_str Serialize Change
 * @return {Change}            Change instance
 * @throws {Error}             On invalid serialization input
 */
export function deserializeChange(change_str: string): Change  {
    return changeFromJSON(JSON.parse(change_str));
}
/**
 * Represent change as JSON
 *
 * @param   {Change}     change Change to serialize
 * @returns {ChangeJSON}        JSON representation of change
 */
export function changeToJSON(change: Change): ChangeJSON {
    const change_json: ChangeJSON = {
        type: change.type
    };

    switch (change.type) {
        case ChangeType.END_TURN: break;
        case ChangeType.START_GAME: break;
        case ChangeType.CREATE_ENT:
            change_json.entity = (change as CreateEntity).entity;
            break;
        case ChangeType.DESTROY_ENT:
            change_json.entity = (change as DestroyEntity).entity;
            break;
        case ChangeType.ATTACH_COMP:
            change_json.entity = (change as AttachComponent).entity;
            change_json.component =
                componentToJSON((change as AttachComponent).component);
            break;
        case ChangeType.DETACH_COMP:
            change_json.entity = (change as DetachComponent).entity;
            change_json.component =
                componentToJSON((change as DetachComponent).component);
            break;
        case ChangeType.UPDATE_COMP:
            change_json.component =
                componentToJSON((change as UpdateComponent).component);
            break;
        default:
            ASSERT(false);
    }

    return change_json;
}
/**
 * Convert a JSONified change into an instance
 *
 * @param  {string} change_json JSONified Change
 * @return {Change}             Change instance
 * @throws {Error}              On invalid serialization input
 */
export function changeFromJSON(change_json: ChangeJSON): Change {
    switch (change_json.type) {
        case ChangeType.END_TURN: return new EndTurn();
        case ChangeType.START_GAME: return new StartGame();
        case ChangeType.CREATE_ENT:
            if (change_json.entity == undefined) {
                throw new Error("Invalid create entity json: no entity");
            }

            return new CreateEntity(change_json.entity);
        case ChangeType.DESTROY_ENT:
            if (change_json.entity == undefined) {
                throw new Error("Invalid destroy entity json: no entity");
            }

            return new DestroyEntity(change_json.entity);
        case ChangeType.ATTACH_COMP:
            if (change_json.entity == undefined) {
                throw new Error("Invalid attach component json: no entity");
            } else if (change_json.component == undefined) {
                throw new Error("Invalid attach component json: no component");
            }

            return new AttachComponent(
                change_json.entity, componentFromJSON(change_json.component));
        case ChangeType.DETACH_COMP:
            if (change_json.entity == undefined) {
                throw new Error("Invalid detach component json: no entity");
            } else if (change_json.component == undefined) {
                throw new Error("Invalid detach component json: no component");
            }

            return new DetachComponent(
                change_json.entity, componentFromJSON(change_json.component));
        case ChangeType.UPDATE_COMP:
             if (change_json.component == undefined) {
                throw new Error("Invalid detach component json: no component");
            }

            return new UpdateComponent(
                componentFromJSON(change_json.component));
    }
}
/**
 * Represent the changeset as a string
 *
 * @param   {List<Change>} changeset Changeset to serialize
 * @returns {string}                 Serialize match info
 */
export function serializeChangeset(changeset: List<Change>): string {
    return JSON.stringify(changesetToJSON(changeset));
}
/**
 * Convert a serialized changeset into an instance
 *
 * @param  {string}       changeset_str Serialize Changeset
 * @return {List<Change>}               Changeset instance
 * @throws {Error}                      On invalid serialization input
 */
export function deserializeChangeset(changeset_str: string): List<Change>  {
    return changesetFromJSON(JSON.parse(changeset_str));
}
/**
 * Represent changeset as JSON
 *
 * @param   {List<Change>}  changeset Changeset to serialize
 * @returns {ChangesetJSON}           JSON representation of changeset
 */
export function changesetToJSON(changeset: List<Change>): ChangesetJSON {
    return changeset.toArray().map(changeToJSON);
}
/**
 * Convert a JSONified changeset into an instance
 *
 * @param  {string}       changeset_json JSONified Changeset
 * @return {List<Change>}                Changeset instance
 * @throws {Error}                       On invalid serialization input
 */
export function changesetFromJSON(changeset_json: ChangesetJSON): List<Change> {
    return List<Change>(changeset_json.map(changeFromJSON));
}

