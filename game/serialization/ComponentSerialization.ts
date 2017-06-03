/**
 * @file game/serialization/ComponentSerialization.ts
 * Functions for (de)serializing components
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"
import { HexPositionData } from "../components/HexPosition"
import { TeamData } from "../components/Team"
import { NameData } from "../components/Name"
import { DeployableData } from "../components/Deployable"
import { DeployZoneData } from "../components/DeployZone"
import { ASSERT } from "../util"

/**
 * Component JSONified
 */
export type ComponentJSON = {
    id: ComponentID;
    type: ComponentType;
    data: string;
};
export type ComponentImplJSON<T> = {
    id: ComponentID;
    type: ComponentType;
    data: T;
};

/**
 * Represent component as a string
 *
 * @param   {Component} comp Component to serialize
 * @returns {string}         Serialized component
 */
export function serializeComponent(comp: Component): string {
    return JSON.stringify(componentToJSON(comp));
}
/**
 * Convert a serialized component comp into an instance
 *
 * @param  {string}    comp_str Serialized Component
 * @return {Component}          Component instance
 * @throws {Error}              On invalid serialization input
 */
export function deserializeComponent(comp_str: string): Component  {
    return componentFromJSON(JSON.parse(comp_str));
}
/**
 * Represent a Component as JSON
 *
 * @param   {Component}     comp Component to serialize
 * @returns {ComponentJSON}      JSON representation of component
 */
export function componentToJSON(comp: Component): ComponentJSON {
    let data = "";

    switch (comp.type) {
        case ComponentType.HEX_POSITION:
            data = serializeComponentImpl(comp as ComponentImpl<HexPositionData>);
            break;
        case ComponentType.TEAM:
            data = serializeComponentImpl(comp as ComponentImpl<TeamData>);
            break;
        case ComponentType.NAME:
            data = serializeComponentImpl(comp as ComponentImpl<NameData>);
            break;
        case ComponentType.DEPLOYABLE:
            data = serializeComponentImpl(comp as ComponentImpl<DeployableData>);
            break;
        case ComponentType.DEPLOY_ZONE:
            data = serializeComponentImpl(comp as ComponentImpl<DeployZoneData>);
            break;
        default:
            ASSERT(false);
    }

    return {
        type: comp.type,
        id: comp.id,
        data: data
    };
}
/**
 * Convert a JSONified component comp into an instance
 *
 * @param  {string}    comp_json JSONified Component
 * @return {Component}           Component instance
 * @throws {Error}               On invalid serialization input
 */
export function componentFromJSON(comp_json: ComponentJSON): Component {
    switch (comp_json.type) {
        case ComponentType.HEX_POSITION:
            return deserializeComponentImpl<HexPositionData>(comp_json.data);
        case ComponentType.TEAM:
            return deserializeComponentImpl<TeamData>(comp_json.data);
        case ComponentType.NAME:
            return deserializeComponentImpl<NameData>(comp_json.data);
        case ComponentType.DEPLOYABLE:
            return deserializeComponentImpl<DeployableData>(comp_json.data);
        case ComponentType.DEPLOY_ZONE:
            return deserializeComponentImpl<DeployZoneData>(comp_json.data);
    }

    throw new Error("Unexhaustive component deserialization");
}
/**
 * Represent component impl as a string
 *
 * @param   {ComponentImpl<T>} comp Component to serialize
 * @returns {string}                Serialized component
 */
export function serializeComponentImpl<T>(comp: ComponentImpl<T>): string {
    return JSON.stringify(componentImplToJSON(comp));
}
/**
 * Convert a serialized component impl into an instance
 *
 * @param  {string}           comp_str Serialized ComponentImpl
 * @return {ComponentImpl<T>}          ComponentImpl instance
 * @throws {Error}                     On invalid serialization input
 */
export function deserializeComponentImpl<T>(comp_str: string):
    ComponentImpl<T>  {
    return componentImplFromJSON<T>(JSON.parse(comp_str));
}
/**
 * Represent a ComponentImpl as JSON
 *
 * @param   {ComponentImpl<T>}     comp Component to serialize
 * @returns {ComponentImplJSON<T>}      JSON representation of component
 */
export function componentImplToJSON<T>(comp: ComponentImpl<T>):
    ComponentImplJSON<T> {
    return {
        type: comp.type,
        id: comp.id,
        data: comp.data
    };
}
/**
 * Convert a JSONified component impl into an instance
 *
 * @param  {string}        comp_json JSONified ComponentImpl
 * @return {ComponentImpl}           ComponentImpl instance
 * @throws {Error}                   On invalid serialization input
 */
export function componentImplFromJSON<T>(comp_json: ComponentImplJSON<T>):
    ComponentImpl<T> {
        return new ComponentImpl<T>(comp_json.type, comp_json.id, comp_json.data);
}
