/**
 * @file game/serialization/MatchSerialization.ts
 * Functions for (de)serializing match msg
 */

import { Message, MessageType } from "../Message"
import { TeamID } from "../components/Team"

/**
 * Match msg JSONified
 */
export type MessageJSON = {
    type: MessageType,
    data: string
};
/**
 * Represent that match msg as a string
 *
 * @param   {Message} msg Message to serialize
 * @returns {string}      Serialized message
 */
export function serializeMessage(msg: Message): string {
    return JSON.stringify(messageToJSON(msg));
}
/**
 * Convert a serialized match msg into an instance
 *
 * @param  {string} msg_str Serialized Message
 * @return {Message}        Message instance
 * @throws {Error}          On invalid serialization input
 */
export function deserializeMessage(msg_str: string): Message  {
    return messageFromJSON(JSON.parse(msg_str));
}
/**
 * Represent a Message as JSON
 *
 * @param   {Message}     msg Message to serialize
 * @returns {MessageJSON}     JSON representation of message
 */
export function messageToJSON(msg: Message): MessageJSON {
    return {
        type: msg.type,
        data: msg.data
    };
}
/**
 * Convert a JSONified match msg into an instance
 *
 * @param  {string}    msg_json JSONified Message
 * @return {Message}           Message instance
 * @throws {Error}               On invalid serialization input
 */
export function messageFromJSON(msg_json: MessageJSON): Message {
    return new Message(msg_json.type, msg_json.data);
}
