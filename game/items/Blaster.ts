/**
 * @file game/items/Blaster.ts
 */

import { GameState } from "../Game";
import { Player } from "../Player"
import { Damage } from "../Damage";
import { Ship } from "../Ship";
import { ShipItem } from "../ShipItem"
import { Action, ActionType } from "../Action";
import { Vec2 } from "../Math";
import { TargetDescription, targetInRange, targetHasPlayer } from "../Target";

const BLASTER_COOLDOWN = 0;
const BLASTER_RANGE    = 2;
const BLASTER_COST     = 25;
const BLASTER_DAMAGE   = 20;
const BLASTER_CRIT     = 35;
const BLASTER_NAME     = "Blaster";
const BLASTER_DESC     = `Inflicts ${BLASTER_DAMAGE} (${BLASTER_CRIT}) damage on
                          a targeted enemy within ${BLASTER_RANGE} units`;

/**
 * A blaster is a short-ranged targeted weapon.
 */
 export class Blaster extends ShipItem {
     private ship: Ship | null;

     constructor() {
         super(BLASTER_NAME, BLASTER_DESC, BLASTER_COST, BLASTER_COOLDOWN);
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
     targetRequired(): TargetDescription | null {
        return new TargetDescription([
            targetInRange(BLASTER_RANGE),
            targetHasPlayer(Player.other(this.ship!.player))
        ]);
     }
     /**
      * @see ShipItem.ts
      */
     _use(target: Vec2 | null, state: GameState): boolean {
         if (target == null) return false;

         if (this.ship == null) return false;
         if (this.ship.position == null) return false;

         /* TODO: Validate action */
         const victim = state.grid.at(target);

         if (victim == null) return true;
         if (victim.player == this.ship.player) return true;

         const damage = Damage.fromCombat(this.ship, victim, BLASTER_DAMAGE);

         if (damage != null) {
             this.ship.inflictDamage(damage);
         }

         return true;
     }

 }
