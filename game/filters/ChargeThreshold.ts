/**
 * @file game/filters/ChargeThreshold.ts
 */
import { Charge } from "../components/Charge"
import { Entity } from "../Entity"
import { Filter } from "../Filter"

export class ChargeThreshold extends Filter<Entity> {
    private readonly _min_charge: number;

    constructor(min_charge: number) {
        super();

        this._min_charge = min_charge;
    }

    matches(val: Entity): boolean {
        const charge = val.getComponent(Charge);

        if (charge == null) return false;

        return charge.current_charge >= this._min_charge;
    }
}
