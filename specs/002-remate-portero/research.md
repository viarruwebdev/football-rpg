# Research — Remate contra el portero

**Feature**: 002-remate-portero | **Fecha**: 2026-07-08

No había incógnitas técnicas bloqueantes: el motor de duelos (001) está implementado y testeado, la spec está completamente clarificada, y la instrucción del usuario fija la estrategia de reutilización. Este archivo recoge las decisiones de investigación tomadas durante la planificación.

---

## R-001 — Estrategia de reutilización de packages/core/src/duel/

**Decisión**: `resolveShot` importa directamente de `packages/core/src/duel/`:
- `attributeToInfluence` — compresión de atributos 1-20 → −4..+4.
- `applyDiminishing` — rendimientos decrecientes (100/50/33).
- `computeBand` / `sampleTriangular` — incertidumbre triangular con banda dinámica y Composure.
- Tipo `Rng` — contrato del PRNG splittable.

No se duplica ninguna de estas funciones ni tipos en el módulo de remate. `resolveShot` **solo añade**:
- La tabla de remate (6 tramos asimétricos, distinta de los 7 del eslabón normal).
- Los modificadores específicos de disparo (asistencia, cabezazo, disparo lejano + Long Shots, ángulo).
- Las nuevas variantes de evento (`ShotEvent`).

**Alternativas descartadas**:
- Copiar las funciones compartidas al módulo `shot/`: viola CE-004 (no duplicar) y rompe el principio "el contenido es datos, no código".
- Extraer a un módulo `duel/shared/`: introduce una abstracción prematura sin que haya un tercer consumidor; si aparece un tercero, se extrae entonces.

---

## R-002 — Estructura de módulos del resolvedor de remate

**Decisión**: nuevo directorio `packages/core/src/shot/` paralelo a `duel/`, con los mismos módulos de responsabilidad única:

```
packages/core/src/shot/
├── types.ts           — ShotInput, ShotResult, ShotSegment, ShotEvent
├── classify.ts        — classifyShot(result) → ShotSegment  (6 tramos)
├── modifiers.ts       — applyShotModifiers(ctx) → number[]  (mods de disparo)
├── events.ts          — emitShotEvents(segment) → ShotEvent[]
├── resolveShot.ts     — orchestrador puro
└── index.ts           — re-exports públicos
```

**Razonamiento**:
- El mismo patrón que `duel/` facilita la navegación y los tests unitarios por módulo.
- `shot/` no importa de `duel/` en profundidad: solo los tipos y las funciones puras listadas en R-001. La clasificación de remate es diferente (6 tramos vs 7, umbrales distintos), necesita su propio `classifyShot`.
- `events.ts` de remate es diferente: variantes nuevas, momentum semántico (sin `delta` numérico), inversión de roles.

---

## R-003 — Tipo `ShotEvent` y la decisión de momentum semántico

**Decisión**: el evento de momentum del remate es `{ type: 'momentum'; side: 'attack' | 'defense'; cause: ShotMomentumCause }` **sin campo `delta`**, donde `ShotMomentumCause = 'goal' | 'goalOnRebound' | 'greatSave'`.

**Razonamiento** (clarificación Session 2026-07-08):
- El resolvedor de remate no decide la magnitud del momentum (RF-009 de 001). La magnitud (+2 gol, +1 paradón…) es responsabilidad del sistema de momentum, que lee la `cause` y aplica la tabla.
- La variante `momentum` de `DuelEvent` en 001 sí lleva `delta: number` porque en ese contexto el resolvedor emitía la magnitud concreta. En 002, se decide no propagar ese patrón: el delta del remate no es competencia del resolvedor de remate.
- `ShotEvent` es un union **separado** de `DuelEvent`: no se mezclan en el mismo tipo para no romper los consumidores de `DuelEvent` y para que el discriminador `type` no colisione.

**Variantes de `ShotEvent`**:
```ts
type ShotEvent =
  | { type: 'goal' }
  | { type: 'goalOnRebound' }
  | { type: 'greatSave'; hasCorner: true }   // Paradón → siempre con córner
  | { type: 'solidSave'; roleReversal: true } // Parada sólida → siempre con inversión
  | { type: 'counterattackSave' }             // Parada y contragolpe → transición incluida
  | { type: 'momentum'; side: 'attack' | 'defense'; cause: ShotMomentumCause };
```

**Alternativas descartadas**:
- Reutilizar `DuelEvent` extendido con las variantes de remate: mezcla dos dominios en un solo union, hace los discriminadores ambiguos y rompe el tipo-guardián que consumen los tests de 001.
- Llevar `delta` en el evento de momentum del remate: anticipa la magnitud, que puede variar con el sistema de momentum; mejor delegar.

---

## R-004 — Long Shots: lógica de mitigación

**Decisión**: reducción absoluta de 2 sobre la penalización base, aplicada igual en Ataque y Medio:

| Zona | Penalización base | LS 16+ | LS 18+ |
|------|-------------------|--------|--------|
| Ataque | −3 | −1 | 0 |
| Medio | −5 | −3 | 0 |

Suelo 0: Long Shots nunca convierte la penalización en bonus.

**Razonamiento** (clarificación Session 2026-07-08):
- §6 solo especifica la mitigación sobre Ataque (−3). Medio no estaba definido; se extiende el mismo alivio absoluto por balance y por coherencia con las demás vías de mitigación (Cañonero, "Disparo lejano frecuente") que todas operan en puntos absolutos.
- Opción C (LS solo mitiga Ataque, Medio fijo) aplanaría Long Shots desde Medio; descartada por balance.

---

## R-005 — Banda de incertidumbre y calibración de CE-002

**Decisión**: heredar `computeBand` / `sampleTriangular` con la banda 10/11/12 de ADR-0001. **No recalibrar** en esta feature; validar con harness.

**Razonamiento** (clarificación Session 2026-07-08):
- La banda se calibró para el eslabón normal; puede no producir las tasas de gol deseadas sobre la tabla asimétrica del remate. Pero recalibrar antes de medir introduce sesgo.
- CE-002 define la métrica: **tasa de gol por remate que llega al portero** (orden 40-55% para rematador élite vs portero mediocre). Si el harness la confirma dentro de esa banda, no hay ADR. Si se sale, se abre un ADR de remate (análogo a ADR-0001 de 001).

---

## R-006 — Extensión del harness `tools/sim`

**Decisión**: ampliar `tools/sim/index.ts` con un escenario de remate (CE-002) que mide tasa de gol / remates efectivos. El escenario bloquea si cae fuera de 40-55% (élite rematador vs portero mediocre). Informativo para las otras métricas.

**Razonamiento**: el harness ya corre partidos IA-vs-IA. Añadir el escenario de remate es coherente con cómo se validó CE-002 de la 001. Medir goles/partido en simulación completa queda para cuando exista la cadena de posesión completa (feature posterior).
