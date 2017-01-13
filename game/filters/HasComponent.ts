/**
 * @file game/filters/HasComponent.ts
 */
import { Entity } from "../Entity"
import { Component } from "../Component"
import { Filter } from "../Filter"

export class HasComponent<T extends Component> extends Filter<Entity> {
    private readonly _component: ComponentConstructor[];

    constructor(components: { new (...args: any[]): T; }) {
        super();

        this._components = components;
    }

    matches(val: Entity): boolean {
        return (val.getComponent(component) != null);
    }
}
