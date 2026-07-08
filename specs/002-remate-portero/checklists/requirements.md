# Requirements Checklist: Remate contra el portero

**Purpose**: Valida la calidad, completitud y consistencia de los requisitos de la feature 002 — son "unit tests del inglés" (o en este caso, del español): prueban que los requisitos están bien escritos, no que la implementación funciona.
**Created**: 2026-07-08
**Feature**: [spec.md](../spec.md) · [data-model.md](../data-model.md) · [contracts/resolveShot.md](../contracts/resolveShot.md)

---

## Completitud de requisitos funcionales

- [x] CHK001 — ¿Están definidos los seis tramos de la tabla de remate con sus rangos numéricos exactos y sin huecos ni solapes? [Completeness, Spec RF-004]
- [x] CHK002 — ¿Está especificado que `unstoppableGoal` y `goal` producen los mismos eventos mecánicos (distinción solo narrativa/UI)? [Clarity, data-model.md §ShotSegment]
- [x] CHK003 — ¿Está definido el tramo `goalOnRebound` como gol (no parada) con su evento de momentum atacante, verificado contra §6? [Consistency, Spec Clarification Session 2026-07-08 Q4]
- [x] CHK004 — ¿Está documentado que el tramo `greatSave` implica siempre córner (`hasCorner: true`), sin condición adicional? [Completeness, data-model.md §ShotEvent]
- [x] CHK005 — ¿Está documentado que el tramo `solidSave` implica siempre inversión de roles (`roleReversal: true`), sin condición adicional? [Completeness, data-model.md §ShotEvent]
- [x] CHK006 — ¿Están explicitados qué tramos **no** llevan evento de momentum (`solidSave`, `counterattackSave`) y con referencia a §6? [Completeness, Spec RF-006]
- [x] CHK007 — ¿Están definidos los modificadores de disparo del rematador con sus valores numéricos exactos (asistencia +3, cabezazo +2, avance forzado −2, disparo por zona, ángulo −2)? [Completeness, Spec RF-005]
- [x] CHK008 — ¿Está especificada la mitigación de Long Shots sobre el disparo desde Medio (−5 → −3 con LS 16+; → 0 con LS 18+), además del caso Ataque? [Completeness, Spec RF-005 + Clarification Q3]
- [x] CHK009 — ¿Está definido el suelo de la penalización de Long Shots en 0 (nunca convierte la penalización en bonus)? [Completeness, Spec RF-005]
- [x] CHK010 — ¿Están definidas las precondiciones de rango para `attribute` (1-20) y `composure` (1-20) en `ShotSide`? [Completeness, Spec §Entidades clave — rangos añadidos a EntradaDeRemate]
- [x] CHK011 — ¿Está especificado el punto de extensión `isPenalty?` como no-op en v1 y su alcance futuro (apuesta de palo del portero)? [Completeness, Spec RF-008]

---

## Cobertura de los seis tramos de remate

- [x] CHK012 — ¿Cubre la spec el tramo `unstoppableGoal` (≥+5): efecto, eventos, momentum? [Coverage, Spec RF-004 + RF-006]
- [x] CHK013 — ¿Cubre la spec el tramo `goal` (+3..+4): efecto, eventos, momentum? [Coverage, Spec RF-004 + RF-006]
- [x] CHK014 — ¿Cubre la spec el tramo `goalOnRebound` (+1..+2): efecto (es gol), eventos, momentum? [Coverage, Spec RF-004 + RF-006]
- [x] CHK015 — ¿Cubre la spec el tramo `greatSave` (0): efecto (no gol, córner), eventos, momentum defensor? [Coverage, Spec RF-004 + RF-006]
- [x] CHK016 — ¿Cubre la spec el tramo `solidSave` (−1..−2): efecto (inversión de roles), eventos, ausencia de momentum? [Coverage, Spec RF-004 + RF-006]
- [x] CHK017 — ¿Cubre la spec el tramo `counterattackSave` (≤−3): efecto (contragolpe desde tercio medio), eventos, ausencia de momentum? [Coverage, Spec RF-004 + RF-006]
- [x] CHK018 — ¿Confirma la spec la asimetría fundamental: se necesita `result ≥ +1` para gol; `result = 0` es parada? [Coverage, Spec CE-003]
- [x] CHK019 — ¿Están los seis tramos mutuamente excluyentes y exhaustivos (sin huecos ni solapes sobre los enteros)? [Completeness, data-model.md §ShotSegment invariante]

---

## CE-004 — No duplicar el motor (comprobabilidad)

- [x] CHK020 — ¿Enumera la spec (RF-002) explícitamente qué funciones del motor de 001 reutiliza `resolveShot` sin reimplementar (`attributeToInfluence`, `applyDiminishing`, `computeBand`, `sampleTriangular`, `Rng`)? [Completeness, Spec RF-002]
- [x] CHK021 — ¿Define CE-004 un criterio verificable en forma de "el motor de remate no contiene su propia copia de X"? [Measurability, Spec CE-004]
- [x] CHK022 — ¿Existe en el contrato (`contracts/resolveShot.md`) un test requerido (T015) que valide la pureza y ausencia de duplicación mediante purity guard? [Coverage, contracts/resolveShot.md §T015]
- [x] CHK023 — ¿Documenta el plan (D-001 en plan.md) la decisión de no extender `DuelEvent` y sus razones, garantizando que los tipos del motor de 001 permanecen intactos? [Consistency, plan.md §D-001]
- [x] CHK024 — ¿Define la spec un criterio de aceptación de CE-004 comprobable con un comando o script concreto (p. ej. grep de importaciones cruzadas), o queda solo como afirmación en prosa? [Measurability, Spec CE-004 — añadido comando grep verificable]
- [x] CHK025 — ¿Está documentado en research.md (R-001) el argumento de por qué no extraer un módulo `duel/shared/` (prematuridad) y bajo qué condición se revisaría? [Completeness, research.md §R-001]

---

## Consistencia interna y entre documentos

- [x] CHK026 — ¿Coincide la tabla de mods de disparo en `data-model.md §ShotModifierContext` con los valores de RF-005 de la spec? [Consistency]
- [x] CHK027 — ¿Es consistente la decisión de momentum semántico (sin `delta`) entre la spec (RF-006), el data-model (`ShotEvent`), el contrato y la sección de clarificaciones? [Consistency]
- [x] CHK028 — ¿Están los nombres de los tramos (`ShotSegment`) en inglés en el código y en español en la spec, sin mezcla de idiomas en el mismo documento? [Consistency, AGENTS.md §10 — código en inglés]
- [x] CHK029 — ¿Referencia CE-002 explícitamente la banda heredada (10/11/12, ADR-0001) y la condición de apertura de un ADR propio de remate? [Completeness, Spec CE-002 — añadida cita a ADR-0001 y gatillo explícito]
- [x] CHK030 — ¿Coincide el contrato (`contracts/resolveShot.md §Pipeline interno`) con el modelo de datos en el uso de `keeper.modifiers: []` como lista vacía, no como campo ausente? [Consistency]

---

## Criterios de éxito medibles (CE)

- [x] CHK031 — ¿Define CE-001 un criterio de determinismo con un umbral concreto (100%)? [Measurability, Spec CE-001]
- [x] CHK032 — ¿Define CE-002 la métrica correcta (tasa de gol por remate, no tasa de ganar duelo) con dos niveles: matchup extremo F18/R9 ~80-85% (bloqueante) y tasa agregada 40-55% pendiente de simulación completa? [Measurability, Spec CE-002 — corregido por ADR-0002: 40-55% es tasa agregada, no de matchup extremo]
- [x] CHK033 — ¿Reconoce CE-002 explícitamente que la tasa agregada 40-55% se cierra contra goles/partido en simulación completa, y que las bandas del harness son provisionales hasta esa validación? [Clarity, Spec CE-002]
- [x] CHK034 — ¿Define CE-003 la asimetría de la tabla como propiedad verificable (`result ≥ +1` para gol, `0` es parada)? [Measurability, Spec CE-003]
- [x] CHK035 — ¿Es CE-005 (invariantes heredados) verificable con los mismos property tests de 001 aplicados sobre el módulo `shot/`? [Measurability, Spec CE-005]
- [x] CHK036 — ¿Incluye CE-002 el riesgo de que la banda 10/11/12 no produzca tasas de gol aceptables, con criterio de apertura de ADR explícito? [Clarity, Spec CE-002 — ADR-0002 abierto y cerrado: motor correcto, criterio de medición corregido; tasa F18/R9 ~82% es resultado esperado, no síntoma de desacople]

---

## Casos límite y flujos de excepción

- [x] CHK037 — ¿Define la spec el caso límite `result = 0` (Paradón, no gol) como obligatoriamente asimétrico? [Edge Case, Spec §Casos límite]
- [x] CHK038 — ¿Define la spec el caso límite del rematador con Long Shots 18+ eliminando la penalización por distancia? [Edge Case, Spec §Casos límite]
- [x] CHK039 — ¿Define la spec el caso límite del portero muy superior y la preservación del suelo ±3? [Edge Case, Spec §Casos límite]
- [x] CHK040 — ¿Define la spec el comportamiento cuando `shotZone = 'area'` y `isLateralAngle = true` simultáneamente? [Edge Case, Spec RF-005 — acumulación simple confirmada; verificado en §6 y catálogo: no hay regla de interacción especial entre zona y ángulo]
- [x] CHK041 — ¿Está definido qué sucede cuando `hasAssist = true` e `isHeaderAfterCross = true` simultáneamente? [Edge Case, Spec RF-005 — acumulación simple confirmada: +3 y +2 entran en el bruto y pasan por rendimientos decrecientes]

---

## Dependencias y suposiciones

- [x] CHK042 — ¿Lista la spec las suposiciones de existencia de cartas de disparo (fase A) y de portero (fase P) o sus dobles de prueba? [Assumption, Spec §Suposiciones]
- [x] CHK043 — ¿Documenta la spec la dependencia de la feature 001 (motor puro disponible y testeado)? [Dependency, Spec §Suposiciones + encabezado]
- [x] CHK044 — ¿Está documentada la suposición de existencia de los atributos Finishing, Reflexes y Long Shots en el modelo de jugador? [Assumption, Spec §Suposiciones]
- [x] CHK045 — ¿Está anotado el desajuste de T06 del catálogo (omite el escalón 18+ que §6 sí tiene) como tarea de mantenimiento de contenido separada, fuera de la 002? [Dependency, Spec §Fuera de alcance]
- [x] CHK046 — ¿Está documentado el bonus de transición acumulativo de T06 como feature futura, con su dependencia de estado persistente entre remates? [Dependency, Spec §Fuera de alcance]
