# Core Requirements Checklist: Cadena de posesión y reloj de partido (004)

**Purpose**: Valida la calidad, completitud y comprobabilidad de los requisitos del motor de partido — tabla de consumo, causas de momentum nuevas, y criterios de éxito verificables con grep.
**Created**: 2026-07-10
**Feature**: [spec.md](../spec.md) · [data-model.md](../data-model.md) · [contracts/match-module.md](../contracts/match-module.md)

---

## Completitud de la tabla de consumo de jugadas

- [x] CHK001 — ¿Están las **10** filas exactas de la tabla de consumo del §2 presentes con sus valores? (duelo 1, balón dividido +1 extra, falta+tiro libre +1, córner 2, penalti 2, sustitución 1, cambio de carril 1, pase de seguridad 1, posesión estéril 2, remate 1) — **Resuelto:** RF-002 actualizado con tabla completa de 10 filas. [Completeness, Spec §RF-002]
- [x] CHK002 — ¿Está explícitamente listado qué eventos **no** consumen jugadas? (robar cartas, descartar, efectos pasivos de rasgos o momentum) — **Resuelto:** explícito en RF-002. [Clarity, Spec §RF-002]
- [x] CHK003 — ¿RF-002 deja claro que el "+1 extra del balón dividido" lo cobra el **orquestador** (el reloj), no la feature de mini-duelo, y que el coste de 2 jugadas se aplica aunque el mini-duelo esté fuera de alcance en v1? Sin esta aclaración un implementador puede diferir el cobro a la feature de mini-duelo y romper el reloj. — **Resuelto:** RF-002 especifica que el reloj avanza 2 jugadas ante `splitBall` independientemente de si el mini-duelo se resuelve. [Clarity, Edge Case, Spec §RF-002]
- [x] CHK004 — ¿La spec hace explícito que una misma falta activa **dos reglas simultáneas** (a) +1 jugada de reloj en el momento y (b) +0.5 jugadas al descuento, y que la 004 acepta ambas como entrada sin generar faltas? Sin esta aclaración RF-002 y RF-003 parecen alternativas en vez de complementarias. — **Resuelto:** RF-002 contiene la nota "Falta — doble efecto (ambos coexisten)". [Consistency, Clarity, Spec §RF-002, §RF-003]
- [ ] CHK005 — ¿El requisito CE-002 (reloj exacto) define "60 + descuento" como valor de referencia para el caso sin eventos extra, expresado en términos de la tabla de RF-002? [Measurability, Spec §CE-002]

---

## Completitud y claridad de las tres causas nuevas de momentum

### `possessionStreak` (RF-009)

- [ ] CHK006 — ¿La definición de `possessionStreak` especifica **cuándo exactamente** se evalúa el contador — al terminar el duelo (post-resultado) o al ganar (pre-transición de posesión)? [Clarity, Spec §RF-009]
- [ ] CHK007 — ¿El requisito del one-shot define qué reinicia el flag `possessionStreakEmitted` — "al abrir cada posesión nueva" — y que el reset ocurre tanto en gol como en robo como en reloj a 0? [Completeness, Spec §RF-009, §CE-012]
- [ ] CHK008 — ¿El criterio CE-012 ("ganar el cuarto duelo no re-emite") es suficiente para diferenciar `possessionStreak` de "racha de duelos" continua? ¿El caso "ganar el tercer duelo y perder el cuarto no re-emite" está cubierto o queda implícito? [Coverage, Edge Case, Spec §CE-012]
- [ ] CHK009 — ¿El requisito especifica qué equipo recibe el bonus de `possessionStreak`? (el atacante que ganó 3+ duelos, no ambos) [Clarity, Spec §RF-009]

### `pressingSteal` (RF-009b)

- [ ] CHK010 — ¿RF-009b define "zona avanzada" desde la perspectiva del **atacante** explícitamente — es decir, "Defensa o Medio del atacante" — y no desde la perspectiva del defensor? [Clarity, Spec §RF-009b, §Clarificaciones sesión 2026-07-09]
- [ ] CHK011 — ¿El aviso "⚠️ Es el error más fácil de cometer" en la spec y el criterio CE-014 son suficientes para que un implementador no invierta la regla, o falta un ejemplo numérico (p. ej. atacante en franja 'defense' = robo en campo propio del atacante = lejos del portero del que roba = NO pressing)? [Clarity, Ambiguity, Spec §CE-014]
- [ ] CHK012 — ¿Los dos casos simétricos de CE-014 ("robo en 'defense' del atacante → SÍ; robo en 'area' del atacante → NO") son los únicos dos casos de prueba requeridos, o faltan "midfield → SÍ" y "attack → NO" como casos adicionales para cubrir los 4 valores de `Strip`? [Coverage, Spec §CE-014]
- [ ] CHK013 — ¿La spec define qué equipo recibe el momentum de `pressingSteal`? (el que roba, no el que ataca) [Clarity, Spec §RF-009b]

### Degradación por posesión (RF-010)

- [ ] CHK014 — ¿RF-010 distingue con precisión las dos condiciones de degradación: positivo degrada solo si "sin evento significativo NI duelo ganado" (conjunción OR implícita en la condición negativa), frente a negativo que degrada "siempre"? [Clarity, Spec §RF-010]
- [ ] CHK015 — ¿El requisito especifica que `degradeAndDetect` se llama para **ambos** equipos al cerrar posesión — no solo para el atacante? [Completeness, Spec §RF-010]
- [ ] CHK016 — ¿El caso límite "equipo que acaba de marcar gol: ¿su momentum positivo degrada?" está cubierto? (el gol es evento significativo → no degrada) [Coverage, Edge Case, Spec §RF-010, §Casos límite]
- [ ] CHK017 — ¿La condición "Determination alta (16+) pasa de −2 a 0 en 1 posesión" de §7 está explícitamente marcada como fuera de alcance de la 004, o podría una implementación introducirla por error? [Completeness, Gap, Spec §Fuera de alcance]

---

## Comprobabilidad de CE-005, CE-009 y CE-010 con grep

- [ ] CHK018 — ¿CE-005 ("con momentum +5, el bruto de mods incluye +0.75") produce una aserción que puede verificarse sin ejecutar un partido completo — es decir, existe un test unitario para `buildSituationalModifiers(0, 5)` que comprueba `mods.includes(0.75)`? [Measurability, Spec §CE-005, contracts §Nota B]
- [ ] CHK019 — ¿CE-005 puede comprobarse con grep que `computeMomentumModifier` se llama desde `momentumWiring.ts` y que `applyDiminishing` **no** se llama desde `momentumWiring.ts` ni desde `match/playMatch.ts` directamente? (`grep -n "applyDiminishing" packages/core/src/match` debe ser vacío) [Measurability, Spec §CE-005, contracts §Nota B]
- [ ] CHK020 — ¿CE-009 ("orquestador no reimplementa ninguna función de 001/002/003") puede comprobarse con `grep -rn "function resolveDuel\|function resolveShot\|function applyDiminishing" packages/core/src/match` que devuelva vacío? ¿La spec o los contratos documentan este grep exacto como criterio de aceptación? [Measurability, Spec §CE-009, quickstart §Verificación de no-reimplementación]
- [ ] CHK021 — ¿CE-010 ("resolvedores intactos") documenta el comando de verificación exacto (`git diff main...004-cadena-posesion -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts`)? ¿Está en quickstart.md o solo en los contratos? [Measurability, Spec §CE-010, quickstart §Verificación]
- [ ] CHK022 — ¿CE-009/CE-010 en la spec son comprobables **en tiempo de compilación** además de con grep — es decir, el hecho de que `match/` no re-exporte ni re-declare `resolveDuel` garantiza CE-009 por el grafo de importaciones, no solo por convención? [Measurability, Consistency]

---

## Consistencia entre spec, data-model y contratos

- [ ] CHK023 — ¿El nombre `{ kind: 'possession lost' }` en spec.md §Entidades (con espacio) es consistente con `{ kind: 'possessionLost' }` en data-model.md (sin espacio, camelCase)? Un desacuerdo de nombre entre spec y data-model es un bug de requisitos. [Consistency, Spec §Entidades, data-model.md §PossessionTransition]
- [ ] CHK024 — ¿Los 7 valores de `DuelSegment` en data-model.md (fuente: `duel/types.ts`) coinciden exactamente con los 7 valores que aparecen en la spec (RF-020 y §Entidades)? ¿Hay alguno nombrado distinto entre fuentes? [Consistency, Spec §RF-020, data-model.md]
- [ ] CHK025 — ¿La API pública documentada en `contracts/match-module.md` exporta todas las funciones mencionadas como "verificables con grep" en quickstart.md? (`buildSituationalModifiers`, `segmentToTransition`, `createPossession`, `closePossession`, `playMatch`) [Consistency, contracts §Export barrel, quickstart.md]
- [ ] CHK026 — ¿`resetConsecutiveWins` aparece en contracts/match-module.md como import explícito Y en research.md como decisión justificada? ¿Son coherentes en su firma (`(state: MomentumState): MomentumState`)? [Consistency, Spec §RF-009c, contracts §Nota C, research.md #2]

---

## Cobertura de escenarios de borde

- [ ] CHK027 — ¿El caso "reloj a 0 exactamente durante un resultado `splitBall`" está cubierto? (`splitBall` consume 1 jugada extra — ¿se ejecuta la jugada extra aunque el reloj haya llegado a 0 en la jugada normal?) [Coverage, Edge Case, Spec §RF-012, §Casos límite]
- [ ] CHK028 — ¿El caso "último suspiro + possessionStreak pendiente en la misma posesión" está definido — es decir, si el duelo extra del último suspiro es el tercer duelo ganado, ¿se emite `possessionStreak`? [Coverage, Edge Case, Spec §RF-013, §RF-009]
- [ ] CHK029 — ¿CE-015 (reloj monótono) cubre la transición `firstHalf → secondHalf` en términos del reset de `playsElapsed` a 0? ¿La spec define si el contador se reinicia por parte o es absoluto? [Clarity, Spec §CE-015, data-model.md §MatchClock]
- [ ] CHK030 — ¿El requisito RF-014 ("primera posesión de la segunda parte es del visitante") cubre el caso en que el partido termina la primera parte con el local en posesión — quién saca la segunda parte? [Coverage, Edge Case, Spec §RF-014]

---

## Criterios de calidad del harness (CE-006, CE-007, CE-008)

- [ ] CHK031 — ¿CE-008 define "equipos equilibrados de calidad media" con suficiente precisión como para que el harness pueda construir ese matchup sin ambigüedad? (¿hay un fixture de referencia, como el "matchup análogo a F15/R12 del harness de 002"?) [Clarity, Measurability, Spec §CE-008]
- [ ] CHK032 — ¿El protocolo de diagnóstico de CE-008 (pasos a, b, c, d antes de tocar constantes) está documentado en la spec y en quickstart.md, o solo en uno de los dos? [Completeness, Spec §CE-008, quickstart §CE-008]
- [ ] CHK033 — ¿CE-007 ("bandas de calibración de 001/002 no se mueven fuera de banda") referencia las bandas concretas de 001/002 o delega a las specs anteriores sin especificar valores? Si delega, ¿hay un riesgo de que el harness de 004 no importe esas bandas correctamente? [Completeness, Dependency, Spec §CE-007]
