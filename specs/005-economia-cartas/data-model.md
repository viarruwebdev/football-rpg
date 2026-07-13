# Data Model — Economía de cartas (spec 005)

Todas las entidades son datos puros (sin métodos, sin efectos). Las operaciones que las transforman son funciones puras en `packages/core/src/cards/`.

## SubDeck

```ts
interface SubDeck {
  type: 'attack' | 'defense' | 'shared';
  cards: CardInstance[]; // orden = orden de robo (índice 0 = próxima a robar)
}
```

- No tiene pila de descartes (RF-004).
- `attack.cards.length` DEBE ser ≥14 al construirse (precondición, RF-002); `defense.cards.length` ≥8.
- El mini-mazo compartido en prosa se llama "mini-mazo compartido" (ver Clarifications de la spec); en código es `SubDeck` con `type: 'shared'`.

## Hand

```ts
interface Hand {
  cards: CardInstance[]; // máximo 7 (RF-007), mezcla de tipos
}
```

- Invariante (CE-005): `hand.cards.length <= 7` en todo punto de toda secuencia de operaciones.

## GoalkeeperCardData (datos en `content`, NO constantes de motor)

```ts
// packages/content/src/cards/goalkeeperCards.ts — validado con Zod
interface GoalkeeperCardData {
  id: GoalkeeperCardId;      // 'parada-basica' | 'blocaje' | 'despeje-punos' | 'estirada' | 'achique'
  nombre: string;
  potencia: number;          // Parada 3, Blocaje 4, Despeje 4, Estirada 5, Achique 6
  atributoClave: string;     // 'Reflexes' para Estirada, etc.
  umbral: number | null;     // Parada básica: null (siempre). Blocaje 13, Despeje 15, Estirada 15, Achique 17
  umbralAtributo: string | null; // 'Handling' para Blocaje, 'Aerial Reach' para Despeje, etc.
}
```

- **Principio 4, sin excepción:** las cinco cartas del portero son cartas (nombre, potencia, atributo) y los umbrales (Handling ≥13, Reflexes ≥15…) son datos de balance. Que no se roben de un mazo NO las convierte en constantes de motor. Ajustar el balance del portero debe ser un cambio de datos en `content`, no de código en `core`.
- El motor (`goalkeeper.ts`) lee estos datos y evalúa los umbrales contra los atributos del portero; no hardcodea potencias ni umbrales.

## GoalkeeperSet

```ts
interface GoalkeeperSet {
  available: GoalkeeperCardData[]; // Parada básica siempre presente
  usedThisPossession: Set<GoalkeeperCardId>; // se resetea al regenerar
}
```

- Se regenera completo al inicio de cada posesión defensiva del equipo (RF-013) — no se roba de ningún mazo. "Completo" = reconstruir `available` desde `GoalkeeperCardData` + atributos, y `usedThisPossession = ∅`.
- Parada básica: uso ilimitado (RF-014). Superiores: 1 uso por posesión, condicionadas a umbral de atributo (RF-015).

## CardEconomyState

```ts
interface CardEconomyState {
  decks: Record<MomentumSide, { attack: SubDeck; defense: SubDeck; shared: SubDeck }>;
  hands: Record<MomentumSide, Hand>;
  goalkeeperSets: Record<MomentumSide, GoalkeeperSet>;
  mulliganUsedThisPossession: Record<MomentumSide, boolean>;
  retreatUsedThisPossession: Record<MomentumSide, boolean>;
}
```

- Vive en `MatchState.cardEconomy?: CardEconomyState` (opcional — ver research.md D6).
- `mulliganUsedThisPossession` / `retreatUsedThisPossession` se resetean al abrir una posesión nueva (mismo punto donde `playMatch` llama `createPossession`).

## PlayedCard (discriminated union)

```ts
type ImprovisedIntent = 'pass' | 'cross' | 'shot' | 'tackle';

type PlayedCard =
  | { kind: 'natural'; card: PlayedCardSource }
  | { kind: 'converted'; card: PlayedCardSource; effectivePower: number; naturalAttribute: string }
  | { kind: 'improvised'; power: 0; intent: ImprovisedIntent; naturalAttribute: string };
```

- `natural`: carta de la fase correcta, potencia íntegra de la carta.
- `converted`: reconversión (RF-017) — `effectivePower = Math.floor(card.potencia / 2)`, solo si `card.potencia >= 2` (RF-018: potencia 0 y 1 son ilegales — dominadas por improvisar, eliminadas de las reglas). `naturalAttribute` es el de la **fase actual**, no `card.atributoClave`. Construir un `converted` con potencia < 2 es un bug del llamador; `convertCard` lanza, no devuelve null.
- `improvised`: RF-016 — potencia 0 fija. `intent` es la intención elegida por el jugador (parámetro, no inferencia del motor). `naturalAttribute` determinado por la tabla de seis filas (zona×intención): Passing para pase desde Defensa/Medio, Crossing para centro desde Ataque, Finishing para disparo desde Ataque y remate desde Área, Tackling para cuerpo limpio en defensa. Long Shots no es un atributo aquí — su valor mitiga la penalización de distancia del disparo desde Ataque (−3; Long Shots ≥16 reduce en 2, ≥18 elimina), pero el atributo del disparo es siempre Finishing.

## Instant

```ts
interface Instant {
  card: PlayedCardSource; // del mini-mazo compartido (type: 'shared')
  timing: 'preReveal';
}
```

- Se juega en pre-revelado (paso 2 de la secuencia §6), adicional a la carta de acción, no consume jugada (RF-019).
- Al jugarse, sale del juego igual que cualquier carta (ver Clarifications de la spec — no vuelve al fondo).
- Máx. 1 por duelo y por jugador (se valida en el punto de juego, no en el modelo — el modelo no impide construir dos, la regla de "máx. 1" es responsabilidad de la función que aplica instantes dentro de un duelo).

## PlayedCardSource (referencia al esquema de contenido)

```ts
// packages/content/src/cards/schema.ts — reexportado por packages/core/src/cards
interface PlayedCardSource {
  id: string;
  nombre: string;
  categoria: string;
  potencia: number; // 0-10
  atributoClave: string;
  rareza: 'Base' | 'Avanzada' | 'Élite';
  costeEnergia: number;
  restriccion: string | null;
  fase: 'A' | 'D' | 'A/D' | 'I' | 'P';
  efectoId: string;
  efectoTexto: string;
}
```

Validado con `CardSchema` (Zod) en `packages/content`. `packages/core/src/cards` solo consume el tipo inferido (`z.infer<typeof CardSchema>`), nunca reimplementa la validación.

## CardInstance (identidad de instancia — clave para CE-002)

```ts
interface CardInstance {
  instanceId: string;   // determinista: `${card.id}#${índice}` al construir el mazo
  card: PlayedCardSource;
}
```

- **Por qué existe:** el `id` de catálogo NO identifica una copia. Dos copias de `P01` comparten `id`, así que "carta jugada" y "carta descartada al fondo" serían indistinguibles a nivel de datos — CE-002 no sería expresable. El `instanceId` es la identidad única de cada copia física en el partido.
- **Generación determinista:** al construir cada `SubDeck` en `createCardEconomyState`, cada carta recibe `instanceId = \`${card.id}#${i}\`` donde `i` es su índice en el mazo original **antes de barajar** (así la identidad no depende del orden de barajado; misma semilla ⇒ mismos instanceId ⇒ mismo reparto).
- **Todas las estructuras portan `CardInstance`, no `Card`:** `SubDeck.cards`, `Hand.cards` y el registro de jugadas son `CardInstance[]`. El adaptador (`cardToDuelSide`) lee `instance.card.potencia`.
- **CE-002 se vuelve trivial:** el multiset de `instanceId` en `(mazo + mano + jugadas)` es constante; ningún `instanceId` jugado reaparece en `mazo` ni `mano`.

## Relaciones y flujo

```
SubDeck (attack/defense/shared) --draw--> Hand
Hand --play--> PlayedCard --adapter (D5)--> DuelSide/ShotSide --resolveDuel/resolveShot--> DuelResult/ShotResult
Hand --discard (exceso/mulligan)--> fondo de SubDeck correspondiente
GoalkeeperSet --regenerate--> (nueva posesión defensiva)
CardEconomyState --lives in--> MatchState.cardEconomy
```

## Invariantes verificables (para property tests, ver quickstart.md)

1. **Conservación (CE-002):** el multiset de `instanceId` en `(todos los SubDeck + todas las Hand + jugadas)` es constante a lo largo de cualquier secuencia de robo/juego/descarte. Una carta jugada sale del universo `mazo+mano` (queda solo en `jugadas`); una descartada se mueve entre `mano` y `mazo` sin cambiar el multiset global.
2. **No reaparición (CE-002):** ningún `instanceId` marcado como jugado vuelve a aparecer en ningún `SubDeck` ni `Hand`. Expresable gracias a `CardInstance` — el `instanceId` distingue copias que comparten `id` de catálogo.
3. **Mano acotada (CE-005):** `hand.cards.length <= 7` siempre.
4. **Suelo de precondición (RF-002):** `assertDeckFloor` lanza si `attack.cards.length < 14 || defense.cards.length < 8` al construir.
5. **Determinismo (CE-001):** mismo `Rng` inicial ⇒ mismo orden de barajado ⇒ mismos robos ⇒ mismo `PlayedCard` en cada duelo.
