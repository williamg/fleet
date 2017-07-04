/**
 * @file game/components/Effects.ts
 * The Effects component simply stores a list of component IDs to components
 * that contain the actual data for a specific status effect. Status effects
 * should be implemented by subclassing the Effect type.
 */
import { Component, ComponentID, ComponentType, ComponentImpl }
    from "../Component"

export type EffectData<Data> = {
    name: string,
    description: string,
    effect_data: Data;
};
