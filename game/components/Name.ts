/**
 * @file game/components/Name.ts
 * Component for a named entity
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export type NameData = {
    name: string
};

export type Name = ComponentImpl<NameData>;

export function newName(id: ComponentID, data: NameData): Name {
    return new ComponentImpl(ComponentType.NAME, id, data);
}
