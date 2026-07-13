import type { CardEconomyState, EffectHandler } from '../types';

const identity: EffectHandler = (state: CardEconomyState) => state;

const registry = new Map<string, EffectHandler>();

export function registerEffect(id: string, handler: EffectHandler): void {
	registry.set(id, handler);
}

export function getEffect(id: string): EffectHandler {
	return registry.get(id) ?? identity;
}
