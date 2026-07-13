# Contrato — `packages/core/src/cards`

Interfaz pública que consume `match/playMatch.ts` y (más adelante) el harness de simulación. No es una API HTTP: es el contrato de módulo interno entre `cards` y `match`, análogo a como `duel`, `shot` y `momentum` exponen barrels (`index.ts`).

## Funciones exportadas (barrel `cards/index.ts`)

### Construcción y barajado

```ts
function createCardEconomyState(
  decks: { home: RawDecks; away: RawDecks },
  rng: Rng,
): CardEconomyState
```
- Valida el suelo mínimo por equipo (`assertDeckFloor`, lanza si no se cumple — RF-002).
- Baraja los tres sub-mazos de cada equipo con Fisher-Yates, un `rng.split()` por sub-mazo (D3).
- Reparte la mano inicial: 5 ofensivas + 2 defensivas (RF-008).
- Regenera el set inicial del portero de cada equipo (RF-013).

### Robo

```ts
function drawOnPossessionChange(
  state: CardEconomyState,
  newAttacker: MomentumSide,
): CardEconomyState
```
- Ambos equipos roban a la vez (RF-010): nuevo atacante 2 ofensivas+1 compartida, nuevo defensor 1 defensiva+1 compartida.
- Robar de un sub-mazo agotado no falla — devuelve lo que haya (RF-006).
- Si excede 7 en mano, el llamador (orquestador o UI) decide el descarte — esta función NO auto-descarta; devuelve el estado con la mano posiblemente >7 y es responsabilidad de quien la invoque forzar el descarte antes del siguiente duelo (ver `discardToLimit`).

### Mano y descarte

```ts
function discardToLimit(hand: Hand, deck: { attack: SubDeck; defense: SubDeck; shared: SubDeck }, chosen: PlayedCardSource[]): { hand: Hand; decks: ... }
function mulligan(state: CardEconomyState, side: MomentumSide, discarded: PlayedCardSource[]): CardEconomyState
```
- `mulligan`: máx. 1 por posesión (valida `mulliganUsedThisPossession`), descarta ≤2, roba 2 del sub-mazo de la fase actual, la mano no crece (RF-011). Si el sub-mazo tiene menos, roba lo que haya.

### Jugar una carta

```ts
function playCard(hand: Hand, card: PlayedCardSource): { hand: Hand; played: PlayedCardSource }
function improviseCard(strip: Strip, intent: ImprovisedIntent): PlayedCard // kind: 'improvised' — lanza si intent es ilegal en strip (e.g. 'cross' desde 'defense')
function canConvert(card: PlayedCardSource): boolean // true si card.potencia >= 2; consulta sin efectos para construir lista de acciones legales
function convertCard(card: PlayedCardSource, currentPhaseAttribute: string): PlayedCard // lanza si card.potencia < 2 — llamar sin consultar canConvert primero es un bug del llamador (RF-018)
```

### Adaptador a los resolvedores (D5)

```ts
function cardToDuelSide(played: PlayedCard, attribute: number, composure: number, extraModifiers: number[]): DuelSide
function cardToShotSide(played: PlayedCard, attribute: number, composure: number, extraModifiers: number[]): ShotSide
```
- `extraModifiers` incluye el repliegue (+2) si `retreatUsedThisPossession[defendingSide]` está activo, compuesto por el llamador exactamente igual que hoy hace `buildSituationalModifiers` con presión+momentum.
- Estas funciones NO llaman a `resolveDuel`/`resolveShot` — solo construyen el input. `playMatch` sigue siendo quien invoca los resolvedores (RF-025 intacto).

### Repliegue

```ts
function applyRetreat(state: CardEconomyState, side: MomentumSide, spentCard: PlayedCardSource): CardEconomyState
```
- Cuesta 1 carta de la mano (RF-020), máx. 1 por posesión rival (RF-020), falla si la mano está vacía (RF-021 — lanza, no filtra silenciosamente).
- El +2 resultante se añade al array `extraModifiers` de `cardToDuelSide`/`cardToShotSide` para el defensor durante toda la posesión — no se aplica aquí directamente sobre `DuelInput`.

### Portero

```ts
function regenerateGoalkeeperSet(attributes: GoalkeeperAttributes): GoalkeeperSet // RF-013, D10
function useGoalkeeperCard(set: GoalkeeperSet, cardId: GoalkeeperCardId): { set: GoalkeeperSet; card: GoalkeeperCard } | null // null si ya usada esta posesión (superiores) — CE-008
```

### Consumo del `drawsCard` del éxito aplastante (RF-012, CE-011)

```ts
function drawOnCrushingSuccess(state: CardEconomyState, side: MomentumSide): CardEconomyState
```
- Roba 1 carta del sub-mazo de la fase que corresponda al lado que ganó el éxito aplastante.
- Se invoca desde `playMatch.ts` en la rama `crushingAdvance` de `applyTransition` — el test de no-implementación de la 004 (`possession.test.ts`, "transitionBonus and zoneBoost… never applied") debe romperse al cablear esto y actualizarse a propósito (regla de AGENTS.md §10 sobre puntos de extensión).

### Registro de efectos (vacío en v1, D9)

```ts
function registerEffect(id: string, handler: EffectHandler): void
function getEffect(id: string): EffectHandler // identity si no registrado
```

## Invariantes que el contrato garantiza (verificados por property tests, no por este documento)

- Determinismo: mismo `Rng` inicial + misma secuencia de llamadas ⇒ mismo resultado en cada función.
- Ninguna función muta sus argumentos — todas devuelven estado nuevo.
- Ninguna función de este módulo llama a `Math.random`, `Date.now`, `fetch`, ni accede a DOM (core-determinism-guard).

## Lo que este contrato NO cubre (fuera de alcance, RF-027)

- Qué carta jugar, cuándo hacer mulligan o replegar (decisión de IA — otra feature).
- Efectos concretos de cartas individuales (`getEffect` siempre devuelve `identity` en v1).
- Construcción del mazo desde la plantilla del jugador.
- Retirar cartas de un jugador sustituido.
