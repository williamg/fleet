/**
 * @file game/components/Pilot.ts
 * Component for a pilot. Pilots control the accuracy (crit damage), precision
 * (crit chance), and evasion (dodge change) of ships.
 */
import { Component, ComponentID, ComponentType, ComponentImpl } from "../Component"

export type PilotData = {
    name: string
    accuracy: number,
    precision: number,
    evasion: number
};

export type Pilot = ComponentImpl<PilotData>;

export function newPilot(id: ComponentID, data: PilotData): Pilot {
    return new ComponentImpl(ComponentType.PILOT, id, data);
}
