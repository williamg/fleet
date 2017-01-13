/**
 * @file game/components/ShipInfo.ts
 */
import { Component } from "../Component"
import { Entity, EntityID } from "../Entity"

/**
 * Holds "metadata" about a ship
 */
export class ShipInfo extends Component {
    readonly name: string;
    readonly size: number;

    constructor(entity: Entity, name: string, size: number) {
        super(entity);

        this.name = name;
        this.size = size;
    }
}
