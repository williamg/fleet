/**
 * @file game/Entity.ts
 *
 * "Why build a game when we could build an entity-component-system library
 * instead?"
 *
 * Game objects are represented by entities, which are themselves collections
 * of components. Systems act on subsets of components and are responsible for
 * carrying out the actual game logic.
 */

/* Entitys should be treated as disctinct from "number" whenever possible.
 * Don't do myvar: Entity = anotherID + 1; */
export type Entity = number;


