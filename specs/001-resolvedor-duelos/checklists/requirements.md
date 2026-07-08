# Requirements Checklist: Resolvedor de duelos

**Purpose**: Valida la calidad, completitud y claridad de la spec, plan y data-model antes de implementar. Cubre requisitos funcionales, cobertura de tests, determinismo/pureza del núcleo y calibración del harness.
**Created**: 2026-07-08
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [data-model.md](../data-model.md) · [contracts/resolverDuelo.md](../contracts/resolverDuelo.md)
**Audiencia**: Autor · Momento: pre-implementación (antes de `/speckit-tasks`)

---

## Completitud de requisitos funcionales

- [X] CHK001 — ¿Están documentadas las fórmulas exactas para `FuerzaAtaque` y `FuerzaDefensa` con todos sus sumandos (potencia, influencia, mods, carril)? [Completeness, Spec §RF-001]
- [X] CHK002 — ¿Está especificada la tabla completa de compresión de atributos (1-20 → −4..+4) con todos los rangos sin huecos ni solapamientos? [Completeness, Spec §RF-002, data-model.md]
- [X] CHK003 — ¿Están definidos los tres tramos de rendimientos decrecientes (100%/50%/33%) con ejemplos verificables del §6 (+6→+5, +8→+6, +10→+7)? [Completeness, Spec §RF-003]
- [X] CHK004 — ¿Está especificado qué modificadores entran en el decrecimiento y cuáles son íntegros, sin ambigüedad entre ambas listas? [Completeness, Spec §RF-003/004, football-rules]
- [X] CHK005 — ¿Está documentado el efecto de carril exacto (+2 acierto / −1 fallo) y que no entra en los rendimientos decrecientes? [Completeness, Spec §RF-005]
- [X] CHK006 — ¿Está definida la secuencia completa del duelo con sus seis pasos y los dos puntos de extensión (pre-revelado, post-revelado)? [Completeness, Spec §RF-012]
- [X] CHK007 — ¿Están especificados los siete tramos con sus rangos exactos, sin huecos entre ellos (en particular: 0 como `balonDividido`, −1..−2 como `perdidaSimple`)? [Completeness, Spec §RF-008, data-model.md]
- [X] CHK008 — ¿Están documentados los eventos emitidos por cada uno de los siete tramos, incluyendo `presion(+1)` para `avanceForzado` y `roboCarta` para `exitoAplastante`? [Completeness, data-model.md]
- [X] CHK009 — ¿Está especificado que el resolvedor emite eventos de momentum pero no los aplica (separación de responsabilidades con feature futura)? [Completeness, Spec §RF-009]
- [X] CHK010 — ¿Está documentado el comportamiento cuando ambos lados traen `tecnicaEspecial` (banda fija ±4, ignorando diferencial y Composure)? [Completeness, Spec casos límite]

---

## Claridad y ausencia de ambigüedades

- [X] CHK011 — ¿Está cuantificada la "banda dinámica" con sus tres rangos exactos (0-4→±6, 5-6→±7, 7+→±8) sin adjetivos vagos? [Clarity, data-model.md]
- [X] CHK012 — ¿Está cuantificado el ajuste de Composure por tramos (≥18→−2, 15-17→−1, 8-14→0, <8→+1) de forma exhaustiva y sin solapamientos? [Clarity, data-model.md]
- [X] CHK013 — ¿Está definido el "suelo mínimo de banda" como ±3 con la semántica exacta (`max(banda + ajuste, 3)`)? [Clarity, Spec §RF-007, CE-004]
- [X] CHK014 — ¿Es `TecnicaEspecialId` suficientemente opaca para no acoplar el resolvedor a ninguna técnica concreta en v1? [Clarity, data-model.md]
- [X] CHK015 — ¿Está definido sin ambigüedad que `carrilElegido` pertenece al atacante y `carrilApostado` al defensor, y que la comparación es entre ellos? [Clarity, data-model.md §LadoDuelo]
- [X] CHK016 — ¿Está claro que `modificadores` en `LadoDuelo` es un array de números brutos (no ya procesados) que `applyDiminishing` recibe y transforma? [Clarity, data-model.md, contracts]
- [X] CHK017 — ¿Está definido sin ambigüedad el algoritmo de muestreo de la distribución triangular (suma de dos uniformes, redondeado al entero)? [Clarity, research.md R-002]

---

## Consistencia entre artefactos

- [X] CHK018 — ¿Coinciden los eventos de cada tramo entre `data-model.md` y `plan.md` (pipeline paso 7)? [Consistency, data-model.md, plan.md]
- [X] CHK019 — ¿Coincide la firma de `resolverDuelo` entre `plan.md`, `data-model.md` y `contracts/resolverDuelo.md` (nombre, orden de argumentos, tipos)? [Consistency]
- [X] CHK020 — ¿Son consistentes los rangos de los tramos en `data-model.md §Tramo` y en `plan.md §Pipeline` con la tabla del §6? [Consistency, football-rules]
- [X] CHK021 — ¿Coincide la tabla de compresión de atributos entre `data-model.md` y `spec.md §Clarifications`? [Consistency]
- [X] CHK022 — ¿Son coherentes los `modificadores` listados como "SON mods" en `spec.md §Clarifications` con los que aparecen en el campo `modificadores[]` de `LadoDuelo`? [Consistency, football-rules]

---

## Calidad de los criterios de aceptación

- [X] CHK023 — ¿Es CE-001 (determinismo 100%) objetivamente verificable mediante un test que resuelva el mismo duelo dos veces con el mismo `Rng`? [Measurability, Spec §CE-001]
- [X] CHK024 — ¿Son CE-002 (calibración élite/mediocre 80-85%) y CE-003 (pesos azar/decisión/preparación) objetivamente medibles con el harness de simulación masiva? [Measurability, Spec §CE-002/003] — verificado con test dedicado en `resolveDuel.calibration.test.ts` (no con `tools/sim`, fuera de alcance de esta feature)
- [X] CHK025 — ¿Es CE-004 (suelo de banda ±3) verificable con un test property-based que cubra todas las combinaciones de Composure y diferencial? [Measurability, Spec §CE-004]
- [X] CHK026 — ¿Es CE-005 (cobertura de tramos) verificable con un test que demuestre que todo entero posible cae en exactamente un tramo? [Measurability, Spec §CE-005]
- [X] CHK027 — ¿Está la Historia 3 (carril importa) especificada como un criterio medible y no solo descriptivo ("swing exacto de 3 puntos")? [Measurability, Spec §Historia-3]

---

## Cobertura de escenarios y casos límite

- [X] CHK028 — ¿Está definido el comportamiento cuando la diferencia efectiva es exactamente 4 (límite inferior de la banda ±6 vs ±7)? [Coverage, Edge Case, data-model.md]
- [X] CHK029 — ¿Está definido qué ocurre cuando Composure es exactamente 8 (límite inferior del ajuste neutro) y 15 (límite del ajuste −1)? [Coverage, Edge Case]
- [X] CHK030 — ¿Está especificado el resultado cuando el bruto acumulado de modificadores es exactamente 4 (límite del primer tramo 100%) o exactamente 8? [Coverage, Edge Case, Spec §RF-003]
- [X] CHK031 — ¿Está definido el caso en que solo uno de los dos lados trae `tecnicaEspecial` (¿se aplica banda fija o no)? [Coverage, Edge Case, Spec §casos-límite] — solo se aplica banda fija ±4 si ambos lados la traen; ver `resolveDuel.ts` (`bothSidesHaveSpecialTechnique`)
- [X] CHK032 — ¿Está cubierto el escenario de diferencial muy negativo (atacante muy inferior) para verificar que el suelo de banda sigue siendo ±3? [Coverage, CE-004]
- [X] CHK033 — ¿Está definido el comportamiento cuando `modificadores` es un array vacío (sin mods situacionales)? [Coverage, Edge Case]
- [X] CHK034 — ¿Están documentados los casos de Composure extrema combinados con diferencial extremo (ej. Composure ≥18 + diferencial ≥7, banda resultante 8−2=6, suelo garantizado)? [Coverage, CE-004]

---

## Determinismo y pureza del núcleo (`core-determinism-guard`)

- [X] CHK035 — ¿Está especificado explícitamente que `resolverDuelo` no puede usar `Math.random`, `Date.now`, `Date`, `fetch`, `window` ni `document`? [Completeness, Spec §RF-011, core-determinism-guard] — verificado por `purity.test.ts`
- [X] CHK036 — ¿Está documentado que `rng` no debe mutar tras la llamada y que `resolverDuelo` no muta `entrada`? [Clarity, contracts §Postcondiciones]
- [X] CHK037 — ¿Está definido el árbol exacto de `rng.split()` que usa `resolverDuelo` en v1 (un split para la incertidumbre)? [Completeness, contracts §Uso de rng]
- [X] CHK038 — ¿Está especificada la prohibición de importar desde `apps/` o `ui/` dentro de `packages/core`? [Completeness, Spec §RF-011, core-determinism-guard] — verificado por `purity.test.ts`
- [X] CHK039 — ¿Está definido el invariante de determinismo como propiedad testable con fast-check (`resolverDuelo(input, rng) deepEqual resolverDuelo(input, rng)`)? [Measurability, contracts §Invariantes, CE-001]
- [X] CHK040 — ¿Se especifica que el orden de iteración sobre colecciones en `packages/core` debe ser estable y no depender de `Set`/`Map`? [Completeness, core-determinism-guard] — no se usan `Set`/`Map` en `packages/core/src`

---

## Cobertura de tests requeridos

- [X] CHK041 — ¿Está especificado que debe existir un escenario BDD en `features/001-resolvedor-duelos.feature` con semilla fija como criterio de aceptación? [Completeness, constitución §P5]
- [X] CHK042 — ¿Están definidos los escenarios BDD mínimos (atacante superior tiende a ganar; acierto/fallo de carril con swing 3; resultado 0 emite miniDuelo)? [Completeness, quickstart §Escenario-5]
- [X] CHK043 — ¿Están especificados los 7 invariantes property-based con fast-check (determinismo, rango influencia, suelo banda, monotonía mods, techo momentum, cobertura tramos, carril íntegro)? [Completeness, contracts §Invariantes]
- [X] CHK044 — ¿Están definidos los tests unitarios mínimos por módulo (`attributeToInfluence`, `applyDiminishing`, `computeBand`, `sampleTriangular`, `classify`, `emitEvents`)? [Completeness, plan §Estructura]
- [X] CHK045 — ¿Existe un golden replay definido como snapshot de un partido sembrado para detectar regresiones de comportamiento? [Coverage, constitución §P5]

---

## Harness de calibración (`sim-harness`)

- [X] CHK046 — ¿Están cuantificadas las bandas de calibración de CE-002 con los tres escenarios (élite vs mediocre 80-85%, élite vs pésimo 90-95%, bueno vs bueno ≈50%)? [Measurability, Spec §CE-002] — implementado en `tools/sim/index.ts`, bloqueante, verificado en verde
- [ ] CHK047 — ¿Están cuantificados los pesos objetivo de CE-003 (azar ≈33%, decisión ≈31%, preparación ≈37%) de forma suficiente para que el harness pueda verificarlos? [Measurability, Spec §CE-003] — **PENDIENTE**: no existe fórmula operacional oficial de "peso" en spec/PRD/skill `sim-harness`. La medición actual (descomposición de varianza aislando un factor a la vez) sobre-pesa el azar frente al carril porque compara una banda continua (±6..±8) contra un swing fijo discreto (3 puntos), y no es representativa de cómo se combinan los factores en un duelo real. `pnpm sim` la reporta como informativa, no bloqueante. La medición correcta requiere contribución marginal (variar todos los factores a la vez sobre una muestra grande de duelos reales) — trabajo futuro del harness, no de esta feature.
- [X] CHK048 — ¿Está definido el comando concreto (`pnpm sim`) y el formato de salida esperado del harness para CE-002/003? [Clarity, quickstart §Escenario-2]
- [X] CHK049 — ¿Está especificado que `pnpm sim` debe fallar si las métricas salen de sus bandas (no solo reportarlas)? [Completeness, constitución §P6] — CE-002 es bloqueante; CE-003 es informativa por la ambigüedad de CHK047, documentado explícitamente en la salida del harness

---

## Dependencias y suposiciones

- [X] CHK050 — ¿Está documentado que el catálogo de cartas y atributos se usará como dobles de prueba en v1 si no existe aún? [Assumption, Spec §Suposiciones]
- [X] CHK051 — ¿Está registrada la dependencia de que `makeRng` debe existir en `packages/core/src/rng/` antes de implementar `resolverDuelo`? [Dependency, plan §D-001]
- [X] CHK052 — ¿Está documentado que los tipos de `packages/content` (carta, atributo) deben estar disponibles o mockeados para que `EntradaDeDuelo` compile? [Dependency, plan §D-003] — `DuelInput`/`DuelSide` operan sobre números puros, sin importar `packages/content`
- [X] CHK053 — ¿Está registrado el límite de esta feature respecto a la 002 (sin remate vs portero, sin tabla de umbrales de tiro)? [Assumption, Spec §Fuera-de-alcance]
