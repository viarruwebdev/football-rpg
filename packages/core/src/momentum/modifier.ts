// applyDiminishing (packages/core/src/duel/modifiers.ts, imported by whoever
// composes the pipeline in 004 — not reimplemented here, CE-005) combines this
// modifier with the rest of the situational mods; this function only returns
// the raw, capped momentum contribution.

export function computeMomentumModifier(bar: number): number {
	return Math.max(-0.75, Math.min(0.75, 0.15 * bar));
}
