/**
 * @file game/GameObserver.ts
 */

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



/* Event observers */
export const TurnFinish = new EventObserver<null>();
export const TurnStart = new EventObserver<null>();
