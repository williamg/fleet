/**
 * @file game/filters/HasComponent.ts
 */
import { Entity } from "../Entity"
import { Component } from "../Component"
import { Filter } from "../Filter"

export class HasComponent<T extends Component> extends Filter<Entity> {
    private readonly _component: { new (...args: any[]): T; };

    constructor(component: { new (...args: any[]): T; }) {
        super();

        this._component = component;
    }

    matches(val: Entity): boolean {
        return (val.getComponent(this._component) != null);
    }
}
