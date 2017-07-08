/**
 * @file game/components/EffectsInfo.ts
 * The EffectsInfo component simply stores all the infos for effects on a given
 * entity
 */
import { Component, ComponentID, ComponentType, ComponentImpl }
    from "../Component"

export type EffectInfo = {
    name: string,
    description: string,
    status: string,
    component: ComponentID
};

export type EffectsInfoData = {
    effects: EffectInfo[];
};

export type EffectsInfo = ComponentImpl<EffectsInfoData>;

const default_data = { effects: [] };

export function newEffectsInfo(
    id: ComponentID, data: EffectsInfoData = default_data): EffectsInfo {
    return new ComponentImpl(ComponentType.EFFECTS_INFO, id, data);
}
