# Data Model: Sistema de momentum (003)

Fuente: `spec.md` §Entidades clave + §7 del manual (skill `football-rules`, Parte 2).

---

## MomentumState y MatchMomentumState

`MomentumState` es el estado de un equipo. `MatchMomentumState = { home: MomentumState; away: MomentumState }` es el par completo de un partido — **003 SÍ define este contenedor** (no lo delega a 004): es lo que permite que la resolución de "en la zona" (que depende de ambas barras a la vez, ver Nota de diseño abajo) sea una función pura interna a la 003, testeable de extremo a extremo sin depender de la capa de partido.

**Nota de diseño — "en la zona" es un cupo por EQUIPO BENEFICIADO, no por dirección de la propia barra, y su resolución vive en la 003.** La §7 dice literalmente "a -5 un jugador RIVAL entra en la zona": cuando la barra de un equipo baja a −5, el beneficio (`enteredTheZone`) lo recibe el **otro** equipo, no el que tiene la barra en −5. Por tanto `playerInTheZone` vive en el `MomentumState` del equipo que se beneficia, y se puede conceder por dos caminos independientes que escriben en el MISMO slot: (a) la propia barra de ese equipo llega a +5, o (b) la barra del equipo rival llega a −5.

Delegar la detección del camino (b) a 004 habría sacado una regla de la tabla de umbrales de la §7 fuera del sistema de momentum, y habría dejado el escenario "mi rival cae a −5 y yo gano 'en la zona'" sin poder testearse de extremo a extremo dentro de la 003 (dependería de un orquestador que no existe hasta 004). Como `MomentumState` ya es, por diseño de la spec, "barra por equipo (2 valores)" (§Entidades clave), la 003 tiene toda la información que necesita con solo recibir el par — no requiere nada de la cadena de posesión, el reloj, ni ningún estado que solo 004 posea. `detectThresholdCrossing` recibe el `MatchMomentumState` completo antes/después y el equipo cuya barra acaba de moverse, y resuelve ambos caminos (`ownPeak` y `rivalTrough`) internamente. Lo único que sigue siendo responsabilidad de 004 es **invocar** esta función en el momento correcto del ciclo de posesión — no resolver la regla en sí (ver Nota B del contrato, actualizada).

```ts
interface MomentumState {
  /** Barra fraccional, pasos de 0.5, saturada en [-5, +5]. */
  bar: number;
  /** Duelos ganados consecutivamente por este equipo. Se resetea a 0 al perder
   *  un duelo (resultado <= -1, cualquier tramo de pérdida). */
  consecutiveWins: number;
  /** Máximo valor que `bar` ha alcanzado en el partido. Nunca decrece
   *  (invariante 10 de football-rules). */
  maxReached: number;
  /** Jugadas consecutivas que `bar` ha permanecido en +5 exacto. Se resetea a 0
   *  en cuanto `bar` deja de ser +5 (RF-010: alimenta el bonus post-partido de
   *  "+5 durante 5+ jugadas"). */
  playsAtPeakPositive: number;
  /** Qué umbrales (+3/+4/+5/-3/-4 y el componente "Jugada perfecta" de -5)
   *  ya dispararon su efecto one-shot desde el último cruce por debajo del
   *  umbral inmediatamente inferior (RF-008: se puede volver a disparar tras
   *  bajar y volver a subir). El componente "en la zona" de ±5 NO usa este
   *  set — usa `playerInTheZone`, que no se re-dispara (ver abajo). */
  crossedThresholds: Set<MomentumThreshold>;
  /** Jugador "en la zona" que beneficia a ESTE equipo, si ya se concedió una
   *  vez este partido. Es un cupo único por equipo (RF-008 excepción): se
   *  gana por la propia barra llegando a +5 O por la barra del equipo rival
   *  bajando a -5 (ver Nota de diseño arriba) — cualquiera de los dos caminos
   *  llena este mismo slot, no hay dos slots independientes. `null` si
   *  ninguno de los dos caminos ha ocurrido todavía. */
  playerInTheZone: PlayerInTheZone | null;
}

type MomentumThreshold = 3 | 4 | 5 | -3 | -4 | -5;

interface PlayerInTheZone {
  /** Id del jugador afectado (opaco; el catálogo de jugadores es de otra
   *  feature — mismo criterio que SpecialTechniqueId en duel/types.ts). */
  playerId: string;
  /** Por cuál camino se ganó el cupo: la propia barra llegó a +5, o la barra
   *  del rival bajó a -5. Informativo (para telemetría/UI); no cambia que
   *  sea el mismo cupo único por equipo. */
  triggeredBy: 'ownPeak' | 'rivalTrough';
}
```

**Reglas de validez (invariantes, no solo tipos):**
- `bar ∈ [-5, +5]`, múltiplo de 0.5 (invariante 8, football-rules).
- `maxReached ≥` el `maxReached` anterior tras cualquier operación (invariante 10).
- `playsAtPeakPositive` solo crece mientras `bar === 5` exacto; cualquier otro valor lo resetea a 0.
- `playerInTheZone` se asigna una única vez por partido por equipo, sin importar cuál de los dos caminos (`ownPeak` o `rivalTrough`) lo dispare primero (RF-008 excepción) — una vez no-null, no vuelve a `null` ni se reasigna, ni por el mismo camino ni por el otro. Si un equipo ya lo ganó por `ownPeak` (su propio +5) y más tarde el rival cae a −5 (lo que normalmente dispararía `rivalTrough` a favor de este equipo), esa segunda ocurrencia NO reasigna ni duplica el efecto: el cupo ya estaba lleno.
- `crossedThresholds` se limpia por umbral cuando `bar` cae por debajo del umbral inmediatamente inferior en esa dirección (p. ej. cruzar de nuevo +3 tras haber bajado a +2 vuelve a disparar +3). Esto aplica a +3, +4 y al componente "Jugada perfecta" de +5/−5 (consumible de 1 uso, se re-desbloquea igual que +3/+4 — ver Nota de diseño de RF-007 más abajo: "Jugada perfecta" solo la desbloquea el +5 propio, no el −5 ajeno). El componente "en la zona" (`playerInTheZone`) es la única excepción: no se re-dispara, se asigna una única vez por partido/equipo por cualquiera de los dos caminos (ver arriba).

## MomentumEventCause (tipo de entrada, no de estado)

Discriminante de causa semántica. **Usa directamente los nombres que el código de 002 ya emite** (`ShotMomentumCause`, `shot/types.ts`) donde existen — no hay tabla de traducción que mantener. La tabla de "eventos significativos" de la §7 tiene **9 filas exactas** (manual, `7 Momentum y Energía.md`): marcar gol, encajar gol, gol contra la marea, técnica especial, parada épica, mano a mano, pressing, racha de posesión, paradón estándar. El "éxito aplastante" (±6) **no está en esta tabla** — vive exclusivamente en la tabla de duelos (`DuelSegment.crushingSuccess`, ver §DuelResultDelta) y nunca genera un `MomentumEventCause`.

```ts
type MomentumEventCause =
  | 'goal'                    // Marcar gol / encajar gol: +2 al lado que marca, -2 al otro.
                               //   El ShotEvent ya lleva {side, cause}; el lado determina el signo.
                               //   No hay 'goalFor'/'goalAgainst' separados — es redundante, side ya lo dice.
  | 'tideTurningGoal'          // Gol contra la marea (solo si bar < 0 del equipo que marca): +3 inversión
  | 'specialTechniqueSuccess'  // Técnica especial exitosa por diferencial +5 o más: +1
  | 'epicSave'                 // Parada épica del portero (técnica especial): +1
  | 'oneOnOneSave'             // Portero ataja mano a mano: +1
  | 'pressingSteal'            // Robo de balón en zona avanzada (pressing): +1
  | 'possessionStreak'         // Racha de posesión (3+ duelos ganados en la misma posesión): +1
  | 'greatSave';               // Paradón estándar (tiro vs portero, resultado 0): +1 defensor.
                               //   Nombre igual al de ShotMomentumCause — sin renombrar.
```

**Correspondencia con `ShotMomentumCause` (código real, `shot/types.ts`): `'goal' | 'goalOnRebound' | 'greatSave'`.**
- `'goal'` y `'goalOnRebound'` emiten la **misma** `MomentumEventCause: 'goal'` — la §7 solo distingue "marcar gol" (+2), sin tramo propio para el rebote. El tramo `goalOnRebound` importa para el log de eventos de partido (córner, secuencia de juego), no para el momentum.
- `'greatSave'` se mantiene igual — sin renombrar a ningún término inventado por la spec.
- Las 6 causas restantes (`tideTurningGoal`, `specialTechniqueSuccess`, `epicSave`, `oneOnOneSave`, `pressingSteal`, `possessionStreak`) no tienen origen en `ShotMomentumCause`: las deriva 004 a partir de otras señales del ciclo de posesión (detección de gol con `bar < 0`, resultado de técnica especial, evento de pressing, contador de posesión, etc.) — fuera de alcance de 003, igual que `degradeMomentum`.

**Recuento de cobertura (9 filas → 8 identificadores):** `goal` cubre 2 filas (marcar/encajar) vía `side`; las 7 filas restantes tienen cada una su propio identificador 1:1. 8 identificadores, cobertura exacta de las 9 filas, sin huecos ni sobrantes.

## DuelResultDelta (derivado de `DuelSegment`, tramo más específico)

No es una entidad nueva — es la traducción de `DuelSegment` (ya existente en `duel/types.ts`, expuesto en `DuelResult.segment`) a un delta de momentum vía `DuelMomentumTable`. La tabla de duelos de la §7 tiene **7 tramos exhaustivos** — cubiertos sin excepción (CE nuevo: ningún `DuelSegment` queda sin regla). Mapeo (RF-002, tramo más específico, sin acumular):

| DuelSegment | Delta de momentum | ¿Duelo ganado? (`consecutiveWins`) |
|---|---|---|
| `crushingSuccess` (≥+6) | **+1** (sustituye el +0.5 genérico, no se suma) | **Sí** — incrementa |
| `cleanSuccess` (+3..+5) | **+0.5** | **Sí** — incrementa |
| `forcedAdvance` (+1..+2) | **0** — progresión, no dominio; el defensor no queda batido | **No** — ni incrementa ni resetea |
| `splitBall` (0) | **0** — neutral | **No** — ni incrementa ni resetea |
| `simpleLoss` (−1..−2) | **−1** | **No** — resetea a 0 |
| `disadvantagedLoss` (−3..−5) | **−1.5** | **No** — resetea a 0 |
| `devastatingCounter` (≤−6) | **−2** | **No** — resetea a 0 |

**Definición de "duelo ganado":** solo `cleanSuccess` y `crushingSuccess`. El avance forzado es progresión (el atacante avanza y genera presión, pero el defensor no queda batido). Solo perder el duelo resetea el contador; los resultados neutros (`forcedAdvance`, `splitBall`) ni incrementan ni rompen la racha.

`resolveDuel` no emite ningún evento de momentum para estos tramos (`DuelEvent` ya no tiene la variante `momentum`, eliminada en esta feature — ver research.md #2). `applyDuelResult` lee `DuelResult.segment` directamente.

## MomentumEventTable (dato Zod, `packages/content`)

```ts
const MomentumEventTableSchema = z.record(
  z.enum(['goal', 'tideTurningGoal', 'specialTechniqueSuccess', 'epicSave',
          'oneOnOneSave', 'pressingSteal', 'possessionStreak', 'greatSave']),
  z.number(),
);
```

Dato: valores exactos de la tabla "Eventos significativos (no-duelos)" del manual (`7 Momentum y Energía.md`), 9 filas cubiertas por 8 claves (`goal` cubre marcar/encajar gol vía `side`). `goal: 2` es el delta base (el lado determina el signo en 004); `tideTurningGoal` se aplica condicionalmente (solo si `bar < 0` del equipo que marca) — esa condición vive en la lógica de `momentum/events.ts`, no en el dato. El éxito aplastante (±6) NO tiene clave aquí: se procesa exclusivamente por `DuelMomentumTable.crushingSuccess`.

## DuelMomentumTable (dato Zod, `packages/content`)

```ts
const MomentumDuelTableSchema = z.object({
  crushingSuccess: z.number(),    // +1 (sustituye cleanSuccess para este tramo, no se suma)
  cleanSuccess: z.number(),       // +0.5 (duelo ganado: incrementa consecutiveWins)
  forcedAdvance: z.number(),      // 0 (progresión, no dominio: ni incrementa ni resetea consecutiveWins)
  splitBall: z.number(),          // 0 (neutral: ni incrementa ni resetea)
  simpleLoss: z.number(),         // -1 (resetea consecutiveWins)
  disadvantagedLoss: z.number(),  // -1.5 (resetea consecutiveWins)
  devastatingCounter: z.number(), // -2 (resetea consecutiveWins)
});
```

Los 7 tramos son exhaustivos: toda llamada a `applyDuelResult` con un `DuelSegment` válido encontrará su clave en esta tabla. La clave `won` no existe — `cleanSuccess` y `forcedAdvance` tienen comportamientos diferentes (delta y efecto sobre `consecutiveWins`) y se tratan por separado.

## MomentumModifier (valor derivado, no estado persistente)

```ts
type MomentumModifier = number; // clamp(0.15 * bar, -0.75, +0.75)
```

Se calcula on-demand a partir de `MomentumState.bar` (RF-004); no se guarda en el estado porque es puramente derivado. Se pasa al array `modifiers: number[]` de `DuelSide`/`ShotSide` (existente en `duel/types.ts` y `shot/types.ts`) desde la capa de partido (004) — 003 solo expone la función `computeMomentumModifier(bar: number): MomentumModifier`.

## MatchMomentumState y ThresholdEffect

```ts
type MomentumSide = 'home' | 'away'; // a confirmar en tasks.md contra el modelo de partido real

/** Par de barras de un partido. Definido por la 003 (no delegado a 004)
 *  precisamente para que detectThresholdCrossing pueda resolver el camino
 *  rivalTrough internamente — ver Nota de diseño en §MomentumState. */
interface MatchMomentumState {
  home: MomentumState;
  away: MomentumState;
}

type ThresholdEffect =
  | { type: 'cardPowerBonus'; side: MomentumSide; amount: 1 | -1 }         // ±3
  | { type: 'extraCardDraw'; side: MomentumSide; amount: 1 | -1 }          // ±4
  | { type: 'enteredTheZone'; side: MomentumSide; playerId: string; triggeredBy: 'ownPeak' | 'rivalTrough' } // +5 propio o -5 rival — mismo cupo, `side` es SIEMPRE el equipo beneficiado
  | { type: 'perfectPlayUnlocked'; side: MomentumSide };                   // +5 propio ÚNICAMENTE — el -5 ajeno NO desbloquea esta carta

/** Umbrales que se des-activan porque la barra bajó por debajo del umbral
 *  inmediatamente inferior. Devuelto por `detectThresholdCrossing` junto
 *  con los `ThresholdEffect[]` para que `applyThresholdEffects` los quite
 *  del `crossedThresholds` Set sin necesitar recalcular nada. */
type ThresholdReset =
  | { side: MomentumSide; threshold: MomentumThreshold };
```

## TraitHook (punto de extensión, sin lógica en v1 — RF-017)

```ts
/** Punto de extensión para rasgos (Sangre fría, Precipitado, Defensor
 *  implacable, Organizador). v1 no implementa ningún rasgo; este tipo
 *  existe para que degradeMomentum/applyDuelResult puedan
 *  aceptar un modificador opcional sin cambiar su firma pública cuando
 *  los rasgos se implementen. */
interface TraitHook {
  /** Si está presente, sustituye el delta por defecto de una pérdida de
   *  duelo o de un paso de degradación. Devuelve `undefined` para no
   *  intervenir (comportamiento por defecto). */
  overrideDelta?(context: TraitHookContext): number | undefined;
}

interface TraitHookContext {
  kind: 'duelLoss' | 'degradation';
  defaultDelta: number;
  state: Readonly<MomentumState>;
}
```

No se implementa ningún `TraitHook` concreto en 003 (Sangre fría, Precipitado, etc. quedan fuera de alcance, según spec.md §Fuera de alcance). El tipo se define y se acepta como parámetro opcional en las firmas relevantes, sin uso interno más allá de "si está presente, se invoca; si no, comportamiento por defecto".

## Relaciones y flujo de datos

```
resolveDuel (001)                          resolveShot (002, sin modificar)
        │ DuelResult.segment                       │ emite ShotEvent[] (incluye
        │ (sin eventos de momentum;                │ eventos 'momentum' con cause)
        │  ver research.md #2)                     │
        ▼                                           ▼
momentum/duelResult.ts                     momentum/events.ts
  applyDuelResult(state, segment)             applyEvent(state, cause)
        │ (ambos consumen MomentumEventTable / DuelMomentumTable de packages/content)
        ▼
momentum/state.ts        — satura bar en [-5,+5], actualiza maxReached, playsAtPeakPositive
        ▼
momentum/thresholds.ts   — detectThresholdCrossing(matchBefore, matchAfter, movedSide)
                            → ThresholdEffect[]  (opera sobre MatchMomentumState completo;
                            resuelve ownPeak Y rivalTrough sin ayuda de 004 — ver Nota B
                            del contrato)
        ▼
momentum/modifier.ts     — computeMomentumModifier(bar) → number
        │ se añade a DuelSide.modifiers / ShotSide.modifiers (por la capa de partido, 004)
        ▼
applyDiminishing (packages/core/src/duel/modifiers.ts, importado, NO reimplementado)

momentum/degradation.ts  — degradeMomentum(state, hadSignificantEventOrWin, determinationAvg)
                            → MomentumState  (llamada por 004 al inicio de cada posesión;
                            003 solo la expone, no la invoca desde sí misma)
```
