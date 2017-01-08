/**
 * @fule game/items/EagleEye.ts
 */

import { Ship } from "../Ship"
import { ShipItem } from "../ShipItem"
import { AttributeBuff } from "../effects/AttributeBuff"
import { Vec2 } from "../Math"
import { GameState } from "../Game"

const EE_DURATION = 3;
const EE_COOLDOWN = EE_DURATION + 3;
const EE_COST     = 10;
const EE_ADDITIVE = 2;
const EE_PERCENT  = 0;
const EE_CAP      = 0;
const EE_NAME     = "Eagle Eye"
const EE_DESC     = `Grants ${EE_ADDITIVE} additional accuracy for
                    ${EE_DURATION} turns`;

/**
 * Grants an accuracy buff for a limited time
 */
export class EagleEye extends ShipItem {
    private ship: Ship | null;

    constructor() {
        super(EE_NAME, EE_DESC, EE_COST, EE_COOLDOWN);
    }

    handleEquip(ship: Ship): boolean {
        if (!super.handleEquip(ship)) {
            return false;
        }

        this.ship = ship;
        return true;
    }

    handleUnequip(ship: Ship): void {
        super.handleUnequip(ship);
        this.ship = null;
    }

    _use(target: Vec2 | null, state: GameState): boolean {
        const buff = new AttributeBuff("accuracy", EE_ADDITIVE, EE_PERCENT,
                                       EE_CAP, EE_DURATION);
        this.ship!.applyEffect(buff);
        return true;
    }
}
