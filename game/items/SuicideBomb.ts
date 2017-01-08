/**
 * @file game/items/SuicideBomb.ts
 */

import { GameState } from "../Game";
import { Player } from "../Player"
import { Damage } from "../Damage";
import { Ship } from "../Ship";
import { ShipItem } from "../ShipItem"
import { Action, ActionType } from "../Action";
import { Vec2 } from "../Math";

const SB_COOLDOWN  = 1;
const SB_COST      = 25;
const SB_DAMAGE    = 20;
const SB_NAME      = "Suicide Bomb";
const SB_DESC      = `Inflicts ${SB_DAMAGE} damage to ALL (ally & enemy)
                      ships within 1 unit of this ship.`;

/**
 * SuicideBomb is an AOE weapon that damages all units, friend or foe, in a
 * short radius.
 */
 export class SuicideBomb extends ShipItem {
     private ship: Ship | null;

     constructor() {
         super(SB_NAME, SB_DESC, SB_COST, SB_COOLDOWN);
     }
     /**
      * @see ShipItem.ts
      */
     handleEquip(ship: Ship): boolean {
         if (!super.handleEquip(ship)) {
             return false;
         }

         this.ship = ship;
         return true;
     }
     /**
      * @see ShipItem.ts
      */
     handleUnequip(ship: Ship): void {
         super.handleUnequip(ship);
         this.ship = null;
     }
     /**
      * @see ShipItem.ts
      */
    _use(target: Vec2 | null, state: GameState): boolean {
        if (this.ship == null) return false;
        if (this.ship.position == null) return false;

        let neighbors = state.grid.neighbors(this.ship.position);
        neighbors.push(this.ship.position);

        for (let n of neighbors) {
            const victim = state.grid.at(n);

            if (victim == null) continue;

            const damage = Damage.fromCombat(this.ship, victim, SB_DAMAGE);

            if (damage != null) {
                this.ship.inflictDamage(damage);
            }
        }

        return true;
    }
}
