/**
 * @file game/GameObserver.ts
 * Many of the interactions in the game are event-driven. For example, many
 * status effects happen when a certain event occurs (reflect X% whenever you
 * take damage). This provides the observers for handling the various events.
 */

import { Ship } from "./Ship";

type Handler<T> = (evt: T) => void;

/**
 * Simple generic observer object
 */
class EventObserver<T> {
    private handlers: Map<number, Handler<T>>;
    private next_id: number;

    constructor() {
        this.handlers = new Map<number, Handler<T>>();
        this.next_id = 0;
    }
    /**
     * Add a handler for this event
     * @param  {Handler<T>} handler Handler to add
     * @return {number}             ID of handler
     */
    addHandler(handler: Handler<T>): number {
        const id = this.next_id++;

        this.handlers.set(id, handler);
        return id;
    }
    /**
     * Remove a handler for this event
     * @param {number} id ID of handler remove
     */
    removeHandler(id: number): void {
        this.handlers.delete(id);
    }
    /**
     * Signal this event to all handlers
     * @param {T} event Event to signal
     */
    signal(event: T): void {
        this.handlers.forEach(function(handler) {
            handler(event);
        })
    }
}

/* Event objects */
export interface ShipPreDestroyEvent {
    readonly ship: Ship;
};

export interface ShipDestroyedEvent {
    readonly id: number;
};

/* Event observers */

/**
 * Called after a turn is finished
 * @type {EventObserver}
 */
export const TurnFinish = new EventObserver<null>();
/**
 * Called at the start of every turn
 * @type {EventObserver}
 */
export const TurnStart = new EventObserver<null>();
/**
 * Called *before* a ship is destroyed (the ship is guaranteed to be "valid")
 * for each handler
 * @type {EventObserver}
 */
export const ShipPreDestroy = new EventObserver<ShipPreDestroyEvent>();
/**
 * Called *after* a ship is destroyed (the ship with the given id is no longer
 * guaranteed to exist)
 * @type {EventObserver}
 */
export const ShipDestroyed = new EventObserver<ShipDestroyedEvent>();
