/**
 * @file game/serialization/MatchSerialization.ts
 * Functions for (de)serializing match info
 */

import { MatchInfo } from "../MatchInfo"
import { TeamID } from "../components/Team"

/**
 * Match info JSONified
 */
export type MatchInfoJSON = {
    friendly: TeamID,
};
/**
 * Represent that match info as a string
 *
 * @param   {MatchInfo} info MatchInfo to serialize
 * @returns {string}         Serialize match info
 */
export function serializeMatchInfo(info: MatchInfo): string {
    return JSON.stringify(matchInfoToJSON(info));
}
/**
 * Convert a serialized match info into an instance
 *
 * @param  {string} info_str Serialize MatchInfo
 * @return {MatchInfo}       MatchInfo instance
 * @throws {Error}           On invalid serialization input
 */
export function deserializeMatchInfo(info_str: string): MatchInfo  {
    return matchInfoFromJSON(JSON.parse(info_str));
}
/**
 * Represent that match info as JSON
 *
 * @param   {MatchInfo}     info MatchInfo to serialize
 * @returns {MatchInfoJSON}      JSON representation of match info
 */
export function matchInfoToJSON(info: MatchInfo): MatchInfoJSON {
    return {
        friendly: info.friendly
    };
}
/**
 * Convert a JSONified match info into an instance
 *
 * @param  {string}    info_json JSONified MatchInfo
 * @return {MatchInfo}           MatchInfo instance
 * @throws {Error}               On invalid serialization input
 */
export function matchInfoFromJSON(info_json: MatchInfoJSON): MatchInfo {
    return new MatchInfo(info_json.friendly);
}
