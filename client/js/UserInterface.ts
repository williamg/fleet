/**
 * @file client/js/UserInterface.ts
 * Defines an itnerface for implementing a user interface. In the future, we may
 * have a separate implementation for mobile browsers and desktop browsers. We
 * may also want an interface with a 3D or isomorphic representation. This
 * abstraction provides an easy way to drop in different implementations
 */

import { Action } from "../../game/Action"
import { GameState } from "../../game/Game"
import { ActionCB } from "../../game/Player"

export abstract class UserInterface {
    constructor(action_cb: ActionCB) {

         /* Install resize handler */
         window.onresize = (e) => {
            this.handleResize(window.innerWidth, window.innerHeight);
        }
     }

    startRenderLoop(): void {
        let ui = this;

        function renderLoop(timestamp: number) {
            requestAnimationFrame(renderLoop.bind(ui));
            ui.render(timestamp);
        }

        renderLoop(0);
     }

     /**
      * Report a new game state
      **/
      abstract setState(state: GameState): void;

      /**
       * Update the interface. This will be called once per "iteration" of the
       * game loop. It should perform all of the rendering necessary.
       *
       * @param timestamp Timestamp being renderered
       */
       abstract render(timestamp: number): void;

       protected abstract handleResize(width: number, height: number): void;
 }
