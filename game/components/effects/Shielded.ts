/**
 * @file game/components/effects/Shielded
 * Shielded status effect. Absorbs incoming damage up to a certain amount
 */
import { Component, ComponentID, ComponentType, ComponentImpl }
    from "../../Component"

export type ShieldedData = {
    maximum: number,
    remaining: number,
};

export type ShieldedEffect = ComponentImpl<ShieldedData>;

export function newShieldedEffect(id: ComponentID, data: ShieldedData):
    ShieldedEffect {
    return new ComponentImpl(ComponentType.EFFECT_SHIELDED, id, data);
}
