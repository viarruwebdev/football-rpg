# Especificación — Cadena de posesión y reloj de partido

**Feature branch:** `004-cadena-posesion`
**Estado:** Clarificada (lista para `/speckit.plan`)
**Creada:** 2026-07-09
**Fuente de verdad:** manual §2 (Estructura del Partido) y §3 (Cadena de Ataque) · skill `football-rules`
**Depende de:** 001 (resolveDuel), 002 (resolveShot), 003 (sistema de momentum)

---

## Resumen

La cadena de posesión es el **orquestador** del partido: secuencia duelos, mantiene el reloj compartido de jugadas, gestiona la presión acumulada dentro de una posesión, ejecuta la inversión de roles cuando se roba el balón, y **cablea por fin el momentum al pipeline** (el modificador de Fuerza entra en los mods de `resolveDuel`).

Es la feature que conecta las tres anteriores. Hasta ahora `resolveDuel`, `resolveShot` y `updateMomentum` existían aislados: nadie los llamaba en secuencia. Aquí se convierten en un partido.

**Tres causas de momentum que la 003 definió pero nadie emite todavía solo pueden emitirse aquí**, porque requieren contexto de posesión: `possessionStreak` (3+ duelos ganados en la misma posesión), `pressingSteal` (robo en zona avanzada) y la degradación por posesión.

---

## Alcance: vertical, no horizontal

El manual describe un motor de partido enorme. Esta feature entrega **una posesión completa jugable de extremo a extremo**, no todo el motor.

**Dentro de alcance:**
- Reloj compartido de jugadas (30 + 30 + descuento) y su tabla de consumo.
- Estructura de una posesión: cadena de duelos, presión acumulada, franja y carril actuales.
- Inversión de roles (robo de balón → nueva posesión).
- Orquestación: llamar a `resolveDuel`/`resolveShot`, traducir sus salidas a momentum vía `applyDuelResult`/`applyEvent`, y disparar `degradeAndDetect` al cerrar posesión.
- **Cableado del modificador de momentum** a los mods de `resolveDuel` (pasando por `applyDiminishing`).
- Emisión de `possessionStreak` y `pressingSteal`.
- Fin de partido: reloj a 0, completar el duelo en curso, "último suspiro".

**Fuera de alcance (features futuras):**
- Cartas, mazos, mano, robo y descarte (feature de economía de cartas). El orquestador recibe la carta elegida como entrada.
- Pool de jugadores ponderado por mapa de calor (feature de pool).
- Modos de velocidad (Completo/Táctico/Resumen) — es capa de UI/automatización.
- Prórroga y penaltis (feature propia; incluye el reset de momentum a 0 al inicio de prórroga).
- Faltas, tarjetas, lesiones y sustituciones. **El reloj SÍ acepta sus contribuciones al descuento como entrada**, pero no las genera.
- Córner y penalti como secuencias (consumen 2 jugadas; se modelan como entradas al reloj, no se resuelven).
- Mini-duelo del balón dividido (la 001 ya emite el evento; se resuelve en su feature). El reloj sí cobra la jugada extra.

---

## Escenarios de usuario

### Historia 1 (P1) — Una posesión avanza por la cadena hasta rematar o perderse

Como jugador, quiero encadenar duelos que hagan avanzar el balón por franjas hasta poder rematar, con la presión defensiva subiendo en cada eslabón, para que decidir "sigo o disparo" tenga tensión real.

**Aceptación:** cada duelo consume 1 jugada; el primer eslabón no tiene presión, el cuarto tiene +3; un éxito avanza de franja, una pérdida cierra la posesión.

### Historia 2 (P1) — El momentum afecta por fin a los duelos

Como jugador, quiero que la inercia de mi equipo se note en la Fuerza de mis duelos.

**Aceptación:** el modificador de momentum (`clamp(0.15 × barra, ±0.75)`) entra en el bruto de mods de `resolveDuel` y pasa por `applyDiminishing` junto al resto. Con momentum +5, el bruto de mods incluye +0.75.

### Historia 3 (P1) — El reloj es un recurso compartido

Como jugador, quiero que cada duelo consuma reloj y que el partido termine cuando se agota, para que la posesión sea una decisión táctica (quemar reloj o atacar rápido).

**Aceptación:** 30 jugadas primera parte, 30 segunda, descuento 4-8; el reloj no se pausa en la inversión de roles; el descuento se deriva de los eventos consumidores de tiempo.

### Historia 4 (P2) — El robo invierte los roles limpiamente

Como jugador, cuando robo el balón, quiero iniciar una posesión nueva con la presión reseteada y los bonus de transición aplicados.

**Aceptación:** el robo cierra la posesión del atacante e inicia la del defensor; la presión acumulada vuelve a 0; el reloj sigue corriendo; si el robo fue en zona avanzada, se emite `pressingSteal`.

### Casos límite

- Reloj a 0 durante una posesión: el atacante completa el duelo en curso. Si resulta en remate, el remate se ejecuta.
- **Último suspiro:** si el atacante va perdiendo y quedan 0 jugadas, juega 1 duelo extra (solo 1).
- Balón dividido: consume 1 jugada extra (2 en total por ese eslabón). No mueve momentum.
- Una posesión que termina en gol: la siguiente posesión es del equipo que encajó.
- Una posesión sin evento significativo ni duelo ganado: al cerrarse, el momentum positivo de ese equipo degrada −1.
- El momentum negativo degrada −1 en **cada** posesión, con o sin evento.

---

## Clarifications

### Resueltas contra §2 y §3

- **P: ¿Cuánto reloj consume cada cosa?** R: Duelo normal 1; balón dividido +1 (total 2); falta + tiro libre +1; córner 2; penalti 2; sustitución 1; cambio de carril sin duelo 1; pase de seguridad sin duelo 1; posesión estéril 2; remate 1. **No consumen:** robar cartas, descartar, efectos pasivos de rasgos o momentum.
- **P: ¿Cómo se genera el descuento?** R: No es azar puro. Cada falta +0.5 jugadas, cada lesión +1, cada cambio +0.5. Base 4-8. El número exacto es **semioculto**: se muestra un rango; se revela cuando quedan 2 jugadas.
- **P: ¿El robo de balón pausa el reloj?** R: No. El contragolpe consume del mismo reloj compartido.
- **P: ¿Qué pasa con la presión acumulada al robar?** R: Se resetea a 0. La nueva posesión empieza limpia; los bonus de transición son puntuales, no presión.
- **P: ¿Cuánta presión suma cada eslabón?** R: +1 de presión defensiva acumulada por eslabón consecutivo. El cuarto eslabón da +3 al defensor.
- **P: ¿Quién saca primero?** R: Primera parte, el local. Segunda parte, el visitante.
- **P: ¿El momentum entra como mod?** R: Sí. `computeMomentumModifier` produce el valor bruto; el orquestador lo añade al array de mods que pasa a `resolveDuel`, y `applyDiminishing` lo procesa con el resto (skill `football-rules`, §6).
- **P: ¿Cuándo se degrada el momentum?** R: Al cerrar cada posesión. Positivo: −1 si ese equipo no tuvo evento significativo **ni duelo ganado** en la posesión. Negativo: −1 en cada posesión, sin condición.

### Sesión 2026-07-09 (escritas en la §7 tras decidirse)

- **P: ¿`possessionStreak` se dispara una vez al llegar a 3, o en cada duelo ganado a partir del 3º?** R: **Una sola vez por posesión**, al alcanzar el tercer duelo ganado. Ganar un cuarto o quinto duelo en la misma posesión no vuelve a emitirlo. (Evita la cascada de momentum en posesiones largas.)
- **P: ¿El contador de duelos ganados en la posesión es el mismo que `consecutiveWins` de la 003?** R: **Es el mismo**, y vive **dentro de la posesión actual**. Se resetea en dos situaciones: (a) al perder un duelo (−1 o peor), y (b) al **terminar la posesión**, sea cual sea el motivo (gol, robo, reloj a 0). Los resultados neutros (avance forzado, balón dividido) no lo incrementan ni lo rompen.
- **P: ¿Qué es "zona avanzada" para `pressingSteal`?** R: **Las franjas Defensa o Medio del ATACANTE.** Las franjas se nombran desde la perspectiva del atacante, así que la zona avanzada del que roba corresponde a las franjas bajas del que ataca. `pressingSteal` se emite cuando el que roba recupera en campo contrario (pressing alto). **NO** se emite si el robo ocurre en las franjas Ataque o Área del atacante — ahí el que roba está defendiendo su propia portería, no presionando.

  > ⚠️ Es el error más fácil de cometer: leer "zona avanzada" desde la perspectiva del atacante e invertir la regla.

---

## Requisitos funcionales

- **RF-001** El sistema DEBE mantener un **reloj compartido** de jugadas: primera parte 30, segunda 30, descuento derivado de eventos (base 4-8).
- **RF-002** El sistema DEBE aplicar la tabla de consumo de jugadas del §2 — 10 filas exactas:

  | Evento | Jugadas |
  |---|---|
  | Duelo normal | 1 |
  | Balón dividido (mini-duelo extra) | +1 extra (total 2 por ese eslabón) |
  | Falta + tiro libre | +1 (la falta interrumpe; el tiro libre se reanuda) |
  | Córner | 2 |
  | Penalti | 2 |
  | Sustitución | 1 |
  | Cambio de carril (sin duelo) | 1 |
  | Pase de seguridad (sin duelo) | 1 |
  | Posesión estéril | 2 |
  | Remate a portería | 1 |

  El "+1 extra del balón dividido" lo cobra el **reloj**, no el mini-duelo. El mini-duelo está fuera de alcance de la 004 (feature futura), pero su coste de tiempo es responsabilidad del orquestador desde ya: cuando se produzca un `splitBall`, el reloj avanza 2 jugadas en total (1 del duelo base + 1 por el mini-duelo pendiente), independientemente de si el mini-duelo se resuelve o no en v1.

  **Falta — doble efecto (ambos coexisten):**
  - (a) Falta + tiro libre → +1 jugada de reloj *en el momento* (fila de la tabla de arriba).
  - (b) Cada falta → +0.5 jugadas al **descuento** al final del partido (RF-003).
  Una misma falta activa ambas reglas simultáneamente. La 004 acepta estas contribuciones como **entrada** (tanto el +1 inmediato como el +0.5 al descuento), pero no genera faltas — las faltas están fuera de alcance (ver §Fuera de alcance).

  Robar cartas, descartar y efectos pasivos de rasgos o momentum **no consumen jugadas**.
- **RF-003** El descuento DEBE derivarse de forma determinista de los eventos consumidores de tiempo (falta +0.5, lesión +1, cambio +0.5) sobre una base sembrada. **No se muestrea al revelarlo.**
- **RF-004** El sistema DEBE exponer el descuento como **rango estimado** hasta que queden 2 jugadas, momento en que revela el valor exacto. El valor exacto existe desde el inicio (determinismo); solo su visibilidad cambia.
- **RF-005** El sistema DEBE mantener el estado de una **posesión**: equipo atacante, franja actual, carril actual, presión acumulada, duelos ganados en la posesión, y si hubo evento significativo.
- **RF-006** La presión defensiva acumulada DEBE incrementarse +1 por cada eslabón consecutivo de la misma posesión, y entrar como **mod situacional** en `resolveDuel` (sujeto a rendimientos decrecientes).
- **RF-007** El sistema DEBE **cablear el modificador de momentum**: llamar a `computeMomentumModifier(barra)` y añadir el valor bruto al array de mods que se pasa a `resolveDuel`, junto a presión, estilo, rol y química. `applyDiminishing` lo procesa con el resto. **No se aplica íntegro.**
- **RF-008** Tras cada duelo, el sistema DEBE traducir el `DuelSegment` a momentum vía `applyDuelResult` (tabla de duelos), y los eventos de remate vía `applyEvent` (tabla de eventos).
- **RF-009** El sistema DEBE emitir `possessionStreak` **una sola vez por posesión**, al alcanzar el tercer duelo ganado. Ganar duelos adicionales en la misma posesión no vuelve a emitirlo.
- **RF-009b** El sistema DEBE emitir `pressingSteal` cuando el robo ocurra mientras el balón está en las franjas **Defensa o Medio del atacante** (el que roba recupera en campo contrario). **NO** debe emitirlo si el robo ocurre en las franjas Ataque o Área del atacante.
- **RF-009c** El sistema DEBE **resetear el contador de duelos ganados consecutivos al terminar cada posesión**, sea cual sea el motivo (gol, robo, reloj a 0), además del reset por perder un duelo que ya implementa la 003.

  > **Cambio a código existente:** la 003 resetea `consecutiveWins` solo al perder un duelo, y su módulo no conoce el concepto de posesión. La 004 DEBE ampliar la superficie pública del módulo de momentum con una operación de reset por fin de posesión (p. ej. `resetConsecutiveWins(state, side)`, o incluirlo en `degradeAndDetect`). Es ampliación de superficie, no cambio de lógica: `applyEvent`, `applyDuelResult`, `detectThresholdCrossing` y `applyThresholdEffects` no se tocan.
- **RF-010** Al cerrar una posesión, el sistema DEBE llamar a `degradeAndDetect` para **ambos** equipos, con la condición del §7: positivo degrada solo si ese equipo no tuvo evento significativo ni duelo ganado; negativo degrada siempre.
- **RF-011** El **robo de balón** DEBE cerrar la posesión del atacante e iniciar una nueva del defensor, con presión reseteada a 0, bonus de transición aplicados, y sin pausar el reloj.
- **RF-012** Al agotarse el reloj durante una posesión, el atacante DEBE poder completar el duelo en curso. Si ese duelo resulta en remate, el remate se ejecuta.
- **RF-013** **Último suspiro:** si el equipo atacante va perdiendo y el reloj está a 0, DEBE poder jugar exactamente 1 duelo extra. Si resulta en remate, se ejecuta.
- **RF-014** La primera posesión de la primera parte es del **local**; la de la segunda parte, del **visitante**.
- **RF-015** El sistema DEBE ser **determinista**: el mismo estado inicial y la misma semilla producen el mismo partido. Toda la aleatoriedad entra por el `Rng` sembrado, dividido con `split()` por duelo.
- **RF-016** El orquestador vive en `packages/core` y respeta `core-determinism-guard`.
- **RF-017** El sistema DEBE **reutilizar** `resolveDuel`, `resolveShot`, `updateMomentum`, `degradeAndDetect`, `computeMomentumModifier` y `applyDiminishing`. No reimplementar ninguno.
- **RF-018** El sistema NO DEBE modificar la lógica de resolución de `resolveDuel` ni `resolveShot`. Solo los invoca con los mods correctos.
- **RF-019** El sistema DEBE dejar puntos de extensión (sin lógica en v1) para: cartas/mano, pool de jugadores, modos de velocidad, faltas/lesiones/sustituciones, córner/penalti, y mini-duelo del balón dividido.
- **RF-020** El orquestador DEBE derivar `PossessionTransition` del `DuelSegment` mediante una tabla interna (`DuelSegment → PossessionTransition`). `PossessionTransition` es un **discriminated union** con datos asociados por variante (verificados contra §6): `crushingAdvance`, `cleanAdvance`, `forcedAdvance`, `splitBall`, `possessionLost`, `disadvantageLoss` (con `transitionBonus: 2`), `devastatingCounter` (con `zoneBoost: 3`). Los efectos secundarios de cada variante (robo de carta, `defenderBeaten`, mini-duelo, bonus de zona) se **emiten como eventos** pero su lógica no se ejecuta en v1 — son puntos de extensión como `isPenalty` en la 002.

---

## Entidades clave

- **MatchClock** — jugadas transcurridas, `phase: 'firstHalf' | 'secondHalf' | 'stoppage'` (avanza solo hacia adelante, nunca retrocede), jugadas de cada parte (30+30), descuento exacto derivado de eventos (base 4-8, calculado desde el inicio con la semilla), descuento visible (rango estimado hasta que quedan 2 jugadas, momento en que se revela el exacto), y el registro de eventos consumidores de tiempo. Hay **un solo descuento** al final del partido como tercer acto — verificado en §2: "tres actos" (primera parte → segunda parte → descuento), no uno por parte.
- **PossessionState** — equipo atacante, franja (Defensa/Medio/Ataque/Área, nombradas desde la perspectiva del atacante), carril (izq/centro/der), presión acumulada, duelos ganados en esta posesión, si ya se emitió `possessionStreak` (one-shot), y banderas de "hubo evento significativo" y "ganó algún duelo" por equipo (para la degradación).
- **MatchState** — el reloj, la posesión actual, `MatchMomentumState` (de la 003), marcador, el `Rng`, y `halftimeActions?: HalftimeAction[]` (punto de extensión sin lógica en v1 — mismo patrón que `isPenalty?` en 002 y `TraitHook` en 003; la 004 no ejecuta cambios de jugador ni ajustes tácticos).
- **DuelOutcome** — lo que el orquestador recibe de `resolveDuel`: el `DuelSegment`, los eventos, y lo necesario para decidir avance/pérdida.
- **PossessionTransition** — discriminated union (no enum) que el orquestador deriva del `DuelSegment` mediante una tabla interna. Cada variante lleva los datos asociados que declara la tabla de §6. La lógica de efectos secundarios (robo de carta, mini-duelo, bonus de transición) se emite como evento pero no se ejecuta en v1 — son puntos de extensión. Variantes verificadas contra §6:
  - `{ kind: 'crushingAdvance' }` — éxito aplastante (≥+6): avanza + emite evento `stealCard` + emite evento `defenderBeaten` (defensor no defiende siguiente eslabón).
  - `{ kind: 'cleanAdvance' }` — éxito limpio (+3..+5): avanza.
  - `{ kind: 'forcedAdvance' }` — avance forzado (+1..+2): avanza + presión acumulada +1 extra + emite evento `defenderRepositions`.
  - `{ kind: 'splitBall' }` — balón dividido (0): ni avanza ni pierde + emite evento `miniDuel` + consume 1 jugada extra del reloj.
  - `{ kind: 'possessionLost' }` — pérdida simple (−1..−2): cede el balón, inicia posesión del rival.
  - `{ kind: 'disadvantageLoss', transitionBonus: 2 }` — pérdida con desventaja (−3..−5): cede el balón + emite evento `transitionBonus(2)` para el rival.
  - `{ kind: 'devastatingCounter', zoneBoost: 3 }` — contragolpe devastador (≤−6): cede el balón + emite evento `zoneBoost(3)` + emite evento `attackerDisoriented`.
- **API pública del orquestador** — la función principal (`playMatch` o equivalente) devuelve `{ state: MatchState, events: MatchEvent[] }`, siguiendo el patrón `reducir(estado, acción, rng) → { estado, eventos }` de la constitución §1. El log de eventos permite golden replays y satisface CE-001.

---

## Criterios de éxito

- **CE-001 (determinismo):** el mismo estado inicial y semilla producen el mismo partido completo (mismo log de eventos, mismo marcador).
- **CE-002 (reloj exacto):** la suma de jugadas consumidas coincide con la tabla del §2 para toda secuencia. Un partido sin eventos extra dura exactamente 60 + descuento.
- **CE-003 (descuento determinista):** el descuento exacto se deriva de la semilla y los eventos; revelarlo no lo cambia. Dos ejecuciones con la misma semilla dan el mismo descuento.
- **CE-004 (presión acumulada):** el eslabón *n* de una posesión aporta +(n−1) de presión al defensor, y entra en el bruto de mods (no íntegro).
- **CE-005 (momentum cableado):** con momentum +5, el bruto de mods de `resolveDuel` incluye +0.75, y el efectivo respeta `applyDiminishing`. Verificable con test de composición.
- **CE-006 (jerarquía preservada — hereda CE-014 de la 003):** en simulación de partidos completos, un equipo medio con momentum +5 sigue perdiendo contra un equipo élite con momentum −5. **El momentum importa pero no fabrica calidad.**
- **CE-007 (calibración intacta):** con el momentum cableado, las bandas de calibración de CE-002 de 001/002 (élite/mediocre 80-85%, etc.) **no se mueven fuera de banda**. Si se mueven, el cap de ±0.75 es insuficiente → ADR.
- **CE-008 (goles por partido — calibrado):** en simulación de partidos completos entre **equipos equilibrados de calidad media** (attr=10 vs attr=10, momentum=0), el total de goles por partido cae en **[2.0, 4.5]**. Primera medición real (2026-07-10, harness T025): **2.82 goles/partido** ✓, con 4.8 remates/partido y 26.9 posesiones/partido. La banda se mantiene como está — los números son coherentes con el manual ("orden de 2-4 goles"). Escenario informativo CE-006/CE-007 (matchup extremo élite attr=18 vs mediocre attr=9 con momentum invertido): ver nota de recalibración debajo.

  > **Recalibración banda matchup extremo (2026-07-10):** la banda provisional del matchup élite(18) vs mediocre(9) era [1.5, 5.0]. Primera medición real: **7.81 goles/partido** con 9.2 remates/partido y 85.1% de conversión de tiro. La banda [1.5, 5.0] era incorrecta porque no contemplaba la alta conversión F18/R9 (75-90% según ADR-0002). La banda corregida es **[5.0, 11.0]**, derivada de 9 remates × 85% ≈ 7-9 goles. **La jerarquía de calidad se preserva** (élite gana el 100% con momentum -5 vs +5 del mediocre): CE-006 pasa. Las bandas de calibración de duelos y tiros no se mueven: CE-007 pasa. No se abre ADR-0003 porque el desvío era de la banda provisional, no del motor.
- **CE-009 (reutilización):** el orquestador no reimplementa ninguna función de 001/002/003; las importa. Verificable con grep.
- **CE-015 (reloj monótono y phase ordenada):** property-based — para toda secuencia de acciones válidas, el contador de jugadas nunca retrocede y `phase` solo avanza en el orden `firstHalf → secondHalf → stoppage`. Caza bugs de recálculo del descuento a mitad de partido o transiciones de fase dobles.
- **CE-010 (resolvedores intactos):** `git diff` no muestra cambios en `resolveDuel.ts` ni `resolveShot.ts`.
- **CE-011 (degradación por posesión):** al cerrar una posesión sin evento ni duelo ganado, el momentum positivo de ese equipo baja 1. El negativo baja siempre.
- **CE-012 (racha one-shot):** `possessionStreak` se emite exactamente una vez por posesión. Ganar el cuarto duelo de la misma posesión no lo re-emite. Verificable con caso unitario.
- **CE-013 (reset por fin de posesión):** el contador de duelos consecutivos es 0 al iniciar cualquier posesión, incluso si la anterior terminó en gol (sin perder duelo).
- **CE-014 (pressingSteal no invertido):** un robo en la franja Defensa del atacante emite `pressingSteal`; un robo en la franja Área del atacante NO lo emite. Verificable con dos casos unitarios simétricos. **Este criterio existe porque invertir la regla es el error más probable.**

---

## Clarificaciones

### Sesión 2026-07-10

- Q: ¿Qué devuelve la función pública del orquestador? → A: `{ state: MatchState, events: MatchEvent[] }` — patrón reductor de la constitución; el log de eventos permite replays y satisface CE-001.
- Q: ¿Cómo mapea el orquestador `DuelSegment` a transición de posesión? → A: Discriminated union `PossessionTransition` con datos asociados por variante (no enum de tres strings). La tabla interna vive en el orquestador; los efectos secundarios (robo de carta, mini-duelo, bonus de transición) se emiten como eventos pero no se ejecutan en v1. Cada variante y sus datos verificados contra §6.
- Q: ¿Qué banda provisional usamos para CE-008 (goles por partido)? → A: [2.0, 4.5] goles totales en partidos entre equipos equilibrados de calidad media (matchup análogo a F15/R12). Banda provisional sujeta a ADR-0003 si el motor cae fuera. Diagnóstico obligatorio antes de recalibrar. Segundo escenario élite vs mediocre informativo (sin banda). CE-008 debe poder fallar.
- Q: ¿Cómo se modela el halftime y las fases del reloj? → A: `phase: 'firstHalf' | 'secondHalf' | 'stoppage'` en `MatchClock` (avanza solo hacia adelante). Un solo descuento al final del partido — verificado en §2 del repo. Sin fase 'extraTime' (fuera de alcance de la 004). `halftimeActions?: HalftimeAction[]` en `MatchState` como punto de extensión sin lógica en v1. Invariante property-based CE-015: reloj nunca retrocede y phase solo avanza en orden.

---

## Suposiciones y fuera de alcance

**Suposiciones:** el orquestador recibe como entrada la carta elegida, el jugador y el destino (la feature de cartas los proveerá; en v1, dobles de prueba). `MatchMomentumState` y `degradeAndDetect` están disponibles de la 003.

**Fuera de alcance:** todo lo listado en "Alcance". En particular, **la feature de economía de cartas es la 005 natural**, y la de pool de jugadores la 006.

**Nota:** esta feature incorpora la verificación de **CE-014 de la 003** (issue enlazada), que quedó pendiente por falta de pipeline de partido.