# Especificación — Remate contra el portero

**Feature branch:** `002-remate-portero`
**Estado:** Clarificada (lista para `/speckit.plan`)
**Creada:** 2026-07-08
**Fuente de verdad de las reglas:** manual §6 (tabla de remate) · skill `football-rules`
**Depende de:** 001-resolvedor-duelos (reutiliza su motor puro)

---

## Resumen

El remate es el duelo final de una jugada de ataque: el atacante dispara y el **portero** responde. Se resuelve en uno de seis desenlaces, desde "Gol imparable" hasta "Parada y contragolpe". A diferencia del eslabón normal (001), usa una **tabla de umbrales distinta** —asimétrica, favorable al gol una vez superado el portero—, al portero como defensor (atributos y cartas de portero) y **modificadores propios de remate** (asistencia, cabezazo, disparo lejano…).

Reutiliza sin cambios el motor de 001: compresión de atributos, modificadores con rendimientos decrecientes, `computeBand`/`sampleTriangular` (banda recalibrada 10/11/12 vía ADR-0001), el contrato `Rng` con `split()`, y el discriminated union de eventos. **No reimplementa nada de eso.**

No modela: penaltis (incluida la apuesta de palo del portero), la cadena de posesión que lleva al remate, ni la aplicación del momentum.

---

## Escenarios de usuario y pruebas

### Historia 1 (P1) — Un remate se resuelve en gol o parada

Como jugador, cuando remato, quiero un desenlace que refleje la calidad del disparo frente al portero, con gradación (gol limpio, gol con rebote, paradón, parada y contragolpe), para que rematar tenga tensión y consecuencias.

**Aceptación:** dado un remate, cuando se resuelve, entonces cae en exactamente uno de los seis tramos de la tabla de remate; un rematador claramente superior tiende al gol pero el portero conserva opción real.

### Historia 2 (P1) — El resultado es reproducible

Como desarrollador, quiero que rematar con la misma semilla dé siempre el mismo desenlace, por las mismas razones que en 001 (test, replay, balance).

**Aceptación:** dado un remate y una semilla, cuando lo resuelvo dos veces, obtengo idéntico desenlace y eventos.

### Historia 3 (P2) — Los modificadores de remate importan

Como jugador, quiero que la situación del disparo lo modifique: una asistencia previa lo mejora, un disparo lejano lo penaliza (mitigado por Long Shots), un cabezazo tras centro suma.

**Aceptación:** dado un mismo disparo, cuando llega con asistencia previa (+3) frente a sin ella, entonces la fuerza del rematador difiere en la cantidad especificada; un disparo lejano desde el medio (−5) es marcadamente peor que desde el área.

### Casos límite

- Resultado exactamente 0: **Paradón** (no gol, córner) — el 0 favorece al portero (hace falta +1 para gol con rebote).
- Rematador con Long Shots 18+: el penalizador de disparo lejano se elimina.
- Portero muy superior: la banda dinámica se ensancha igual que en 001; el suelo ±3 se respeta.

---

## Clarifications

### Session 2026-07-08

- Q: ¿Estrategia de banda de incertidumbre para la tabla de remate? → A: Heredar 10/11/12 de 001 y validar con harness. **Corrección post-implementación ([ADR-0002](adr/0002-banda-objetivo-ce002.md)):** el objetivo 40-55% era una estimación de tasa agregada de fútbol real, mal aplicada a un matchup extremo aislado (F18 vs R9). El motor es correcto — differential +5 con banda ±11 produce ~82%, idéntico al duelo con el mismo matchup. La banda 40-55% se redefine como objetivo agregado sobre partidos completos; para el matchup F18/R9 la banda revisada es 80-85%.
- Q: ¿El portero tiene modificadores de remate en v1? → A: El campo de modificadores del portero **existe** en `EntradaDeRemate` (RF-001) pero llega **vacío** en v1; se rellenará cuando existan los mods generales (momentum defensor, estilo, fatiga). No se definen mods propios de portero en esta feature (fuera de alcance). Los mods de RF-005 aplican solo al lado rematador.
- Q: ¿Cómo mitiga Long Shots el disparo lejano desde Medio (−5)? → A: Reducción absoluta de 2 también desde Medio (Long Shots 16+ → −5 pasa a −3; 18+ → elimina la penalización), coherente con la regla del manual §6 para Ataque y con las otras vías de mitigación en puntos. El manual §6 solo especificaba el alivio sobre el −3 de Ataque; se extiende el mismo alivio absoluto al −5 de Medio por balance (evita que Long Shots quede irrelevante desde Medio sin volver fácil el disparo). El escalón 18+ **sí** existe (fuente de verdad: manual §6; la carta T06 del catálogo lo omite — desajuste de contenido a corregir aparte, ver nota fuera de alcance).
- Q: ¿Mapeo de los 6 tramos de la tabla de remate a variantes de `Evento`? → A: Un evento de desenlace por tramo + eventos auxiliares según §6, con el evento de momentum **semántico** (`momentum{lado, causa}` sin delta numérico; la magnitud la fija el sistema de momentum, no el resolvedor — coherente con RF-009 de 001). Verificado contra §6 (tabla "Umbrales de resultado — Remate"), lo que **corrige** el mapeo tentativo inicial: (1) "Gol con rebote" **es gol** (emite `momentum{ataque}`, igual que los otros goles — §6 dice "Gol, +2 momentum"), no una parada; (2) "inversión de roles" es el evento del tramo **Parada sólida**, no un evento suelto; (3) §6 **no** asigna momentum a Parada sólida ni a Parada y contragolpe (este último solo genera el contragolpe desde tercio medio / transición). Mapeo final: Gol imparable ≥+5 → `gol` + `momentum{ataque, 'gol'}`; Gol +3..+4 → `gol` + `momentum{ataque, 'gol'}`; Gol con rebote +1..+2 → `golConRebote` + `momentum{ataque, 'golConRebote'}`; Paradón 0 → `paradon` + `corner` + `momentum{defensa, 'paradon'}`; Parada sólida −1..−2 → `paradaSolida` + `inversionDeRoles` (sin momentum); Parada y contragolpe ≤−3 → `paradaYContragolpe` + `transicion` (sin momentum).

### Sesión 2026-07-08 (resueltas contra el manual §6)

- **P: ¿Hay mind-game de carril en el remate?** R: No. La apuesta de palo del portero es **solo en penaltis** (fuera de alcance). En juego abierto el portero responde con carta + Reflexes, sin carril.
- **P: ¿Qué atributo influye por cada lado?** R: Rematador → Finishing (o el atributo clave de la carta de disparo); portero → Reflexes (cartas de fase P).
- **P: ¿Cuáles son los modificadores de remate?** R: asistencia previa +3; cabezazo tras centro +2; avance forzado previo −2; disparo lejano desde Ataque −3 / desde Medio −5; ángulo lateral del área −2. Son mods (con rendimientos decrecientes). La mitigación de Long Shots (reducción absoluta de 2 con 16+, eliminación con 18+, aplicada a Ataque y Medio por igual) se detalla en RF-005 y en la clarificación de la sesión de arriba.
- **P: ¿Se reutiliza la incertidumbre de 001?** R: Sí. `computeBand`/`sampleTriangular` con la banda recalibrada 10/11/12 y el suelo ±3. No se duplica lógica de azar.
- **P: ¿El resolvedor aplica el momentum del gol?** R: No. Emite un evento de momentum **semántico** (`momentum{lado, causa}`, sin delta numérico) que otra feature consume y dimensiona; el resolvedor no decide la magnitud. El lado y la causa por tramo se detallan en RF-006 y en la clarificación de la sesión de arriba.
- **P: ¿Los umbrales son los del eslabón normal?** R: No. El remate tiene su **propia tabla** de seis tramos (ver RF-004), asimétrica hacia el gol.

---

## Requisitos

### Requisitos funcionales

- **RF-001** El sistema DEBE calcular la fuerza del rematador como `potencia de carta + influencia de Finishing (comprimida) + modificadores de remate`, y la del portero como `potencia de carta + influencia de Reflexes (comprimida) + modificadores`. **Sin efecto de carril.** Los modificadores del rematador son los de RF-005; los del portero son una lista que **existe como campo pero llega vacía en v1** (punto de extensión para mods generales futuros: momentum defensor, estilo, fatiga), no se definen mods propios de portero en esta feature.
- **RF-002** El sistema DEBE **reutilizar** de 001, sin reimplementar: la compresión de atributos (−4..+4), los modificadores con rendimientos decrecientes (100/50/33), `computeBand`, `sampleTriangular` (banda 10/11/12, suelo ±3) y el contrato `Rng` con `split()`.
- **RF-003** El sistema DEBE calcular `Diferencial = FuerzaRematador − FuerzaPortero` y `Resultado = Diferencial + incertidumbre`.
- **RF-004** El sistema DEBE clasificar el `Resultado` en la **tabla de remate**: Gol imparable ≥+5; Gol +3..+4; Gol con rebote +1..+2; Paradón 0; Parada sólida −1..−2; Parada y contragolpe ≤−3.
- **RF-005** El sistema DEBE aplicar los modificadores de remate del §6 (asistencia +3; cabezazo tras centro +2; avance forzado previo −2; disparo lejano desde Ataque −3 / desde Medio −5; ángulo lateral −2). Long Shots mitiga el disparo lejano por **reducción absoluta de 2** con umbral 16+ y **eliminación total** con umbral 18+, aplicada por igual a Ataque (−3 → −1 / 0) y a Medio (−5 → −3 / 0). El suelo de la penalización tras mitigar es 0 (Long Shots nunca convierte la penalización en bonus). **Acumulación de modificadores:** todos los mods de esta lista entran en el bruto acumulado y pasan por los rendimientos decrecientes 100/50/33 de RF-002; no hay interacción especial entre ellos salvo que el manual lo indique explícitamente. En particular: `shotZone = 'area'` e `isLateralAngle = true` simultáneos acumulan sus mods de forma simple (−2 de ángulo lateral entra en el bruto junto a los demás; verificado contra §6 y el catálogo — no existe regla de interacción especial); `hasAssist = true` e `isHeaderAfterCross = true` simultáneos acumulan +3 y +2 de forma simple.
- **RF-006** El sistema DEBE emitir los eventos del tramo resultante según el mapeo verificado contra §6 ("Umbrales de resultado — Remate"), sin aplicar sistemas externos (momentum, energía). El evento de momentum es **semántico** (`momentum{lado, causa}`, sin delta numérico; la magnitud la fija el sistema de momentum, no el resolvedor — igual que RF-009 de 001). Mapeo:
  - Gol imparable (≥+5) → `gol` + `momentum{ataque, 'gol'}`.
  - Gol (+3..+4) → `gol` + `momentum{ataque, 'gol'}`.
  - Gol con rebote (+1..+2) → `golConRebote` (**es gol** según §6) + `momentum{ataque, 'golConRebote'}`.
  - Paradón (0) → `paradon` + `corner` + `momentum{defensa, 'paradon'}`.
  - Parada sólida (−1..−2) → `paradaSolida` + `inversionDeRoles` (§6 no asigna momentum a este tramo).
  - Parada y contragolpe (≤−3) → `paradaYContragolpe` + `transicion` (contragolpe desde tercio medio; §6 no asigna momentum a este tramo).
- **RF-007** El sistema DEBE ser **determinista** (mismos inputs + misma semilla ⇒ mismo desenlace y eventos); toda la aleatoriedad entra por el `Rng` sembrado.
- **RF-008** El remate NO DEBE modelar penaltis ni la apuesta de palo del portero; DEBE dejar previsto el punto de extensión (p. ej. una bandera `esPenalti?`) sin lógica en v1.
- **RF-009** El resolvedor de remate vive en `packages/core` y respeta el guardián de pureza (skill `core-determinism-guard`).

### Entidades clave

- **EntradaDeRemate** — carta y atributo del rematador (Finishing ∈ [1,20]), carta y Reflexes del portero (Reflexes ∈ [1,20]), Composure de ambos lados (∈ [1,20]), modificadores de remate activos (asistencia, tipo de disparo, zona, ángulo, Long Shots ∈ [1,20] del rematador), bandera `esPenalti?` (no-op en v1), y el `Rng` sembrado.
- **ResultadoDeRemate** — el tramo de la tabla de remate, el `Resultado` numérico, y los eventos emitidos.
- **Evento** — se **extiende** el union de 001 con las variantes de remate: `gol`, `golConRebote`, `paradon`, `paradaSolida`, `paradaYContragolpe`, `corner`, `inversionDeRoles`, sin romper las existentes. Cada variante lleva su payload tipado (p. ej. el lado cuando aplique). El evento `momentum` de remate es **semántico**: `{ tipo: 'momentum'; lado: 'ataque' | 'defensa'; causa: 'gol' | 'golConRebote' | 'paradon' }` — sin campo `delta` numérico, a diferencia del `momentum` con `delta` de 001. La magnitud la resuelve el sistema de momentum a partir de la `causa`; el resolvedor de remate no la decide (RF-009 de 001).

---

## Criterios de éxito (medibles, agnósticos de tecnología)

- **CE-001 (determinismo):** el 100% de los remates repetidos con la misma semilla dan desenlace y eventos idénticos.
- **CE-002 (calibración de remate, vía harness):** la banda objetivo se mide como **tasa de gol por remate que llega al portero** (goles / remates efectivos), NO como tasa de ganar el duelo. La banda de incertidumbre se **hereda** de 001 (banda dinámica 10/11/12 y suelo ±3, recalibrada en [ADR-0001](../../specs/001-resolvedor-duelos/adr/0001-recalibrar-banda-dinamica.md)) y no se toca — verificado en [ADR-0002](adr/0002-banda-objetivo-ce002.md). Hay dos niveles de objetivo:
  - **Matchup extremo (F18 vs R9, harness aislado):** tasa esperada **~80-85%**, consistente con la calibración de duelo para la misma disparidad de atributos. Esta tasa se verifica en `pnpm sim` y es bloqueante si sale de [75%, 90%] — banda provisional derivada del análisis del duelo; se refinará con simulación de partidos completos.
  - **Tasa agregada (40-55%):** objetivo sobre goles/partido en simulación de partidos completos con matchups variados — **pendiente** de la feature de simulación completa. Este número incluye remates de posición desfavorable, porteros superiores y matchups equilibrados; no aplica a un matchup extremo aislado.
  - **Punto de medición equilibrado (F15 vs R12):** segundo escenario del harness que actúa como alerta temprana antes de tener simulación completa. Differential moderado; banda provisional **[50%, 75%]** (tasa observada ~55%); banda definitiva se cerrará con simulación completa.
  - La asimetría de la tabla debe reflejarse: a diferencial 0, el resultado favorece al portero (Paradón).
- **CE-003 (asimetría preservada):** hace falta `Resultado ≥ +1` para que haya gol; `0` es parada. La tabla no es simétrica y esa asimetría no debe perderse en la implementación.
- **CE-004 (reutilización, no duplicación):** `packages/core/src/shot/` **importa** de `packages/core/src/duel/` las funciones `attributeToInfluence`, `applyDiminishing`, `computeBand` y `sampleTriangular`, y el tipo `Rng` — no las redefine. Verificable con: `grep -rn "function attributeToInfluence\|function applyDiminishing\|function computeBand\|function sampleTriangular" packages/core/src/shot/` debe devolver cero resultados.
- **CE-005 (invariantes heredados):** se mantienen los invariantes de 001 aplicables (rango de influencia [−4,+4], suelo de banda ±3, monotonía de mods, cobertura de tramos sobre la tabla de remate).

> **Riesgo a verificar (aprendizaje de 001):** la banda 10/11/12 se calibró contra la tabla del **eslabón normal**, no contra la de remate. Antes de dar CE-002 por bueno, confirmar con el harness que esa banda produce tasas de gol razonables sobre la tabla de remate. Si no, el remate podría necesitar su propio tratamiento de banda o de calibración, documentado como ADR — no se asume que la banda heredada valga tal cual.

---

## Suposiciones y fuera de alcance

**Suposiciones:** el motor de 001 (compresión, mods, incertidumbre, Rng, eventos) está disponible y testeado; existen cartas de disparo (fase A) y de portero (fase P), o dobles de prueba; los atributos Finishing, Reflexes y Long Shots existen en el modelo de jugador.

**Fuera de alcance:** penaltis y apuesta de palo (feature futura), la cadena de posesión que produce el remate, aplicación de momentum/energía, y el catálogo completo de cartas de disparo/portero (esta feature solo deja los puntos de extensión).

**Tarea de mantenimiento de contenido (fuera de la feature 002):** la carta **T06 (Disparo lejano)** del catálogo describe "Long Shots 16+ reduce penalización en 2" pero **omite el escalón "18+ elimina"** que sí figura en el manual §6 (fuente de verdad de las reglas). Es un desajuste del catálogo frente a la fuente de verdad; alinearlo es mantenimiento de `packages/content`, no trabajo del resolvedor de remate. Anotar como issue/tarea aparte.

**Feature futura — bonus de transición acumulativo del disparo lejano fallado:** la carta **T06** define una cláusula anti-spam: "cada disparo lejano fallado con resultado 'parada y contragolpe' da al rival +1 de bonus de transición extra acumulativo". El mapeo genérico de RF-006 emite `paradaYContragolpe` + `transicion` para ese tramo, pero **no** captura este bonus acumulativo, que es una consecuencia extra condicionada (carta de disparo lejano + tramo "Parada y contragolpe" + estado acumulado a lo largo del partido), no una regla de la tabla genérica de remate. Requiere estado persistente entre remates y lógica específica de carta — fuera del alcance del resolvedor puro de un único remate (002). Anotar como feature futura, dependiente del sistema de transición/momentum y del contador acumulativo por carta.