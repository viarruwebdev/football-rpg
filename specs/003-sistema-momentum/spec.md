# Especificación — Sistema de momentum (unificado)

**Feature branch:** `003-sistema-momentum`
**Estado:** Clarificada (lista para `/speckit.plan`)
**Creada:** 2026-07-09
**Fuente de verdad:** manual §7 (Momentum unificado) · skill `football-rules` (Parte 2)
**Depende de:** 001-resolvedor-duelos y 002-remate-portero (consume sus eventos; no los modifica)
**Prerrequisito de código:** paso 1 de infraestructura (aritmética fraccional con redondeos explícitos) debe estar mergeado

---

## Resumen

El momentum es la "inercia" de un equipo dentro de un partido. Barra por equipo, oscila entre −5 y +5 en **pasos de 0.5**, empieza en 0. Se mueve por **eventos significativos** (goles, paradas, robos por pressing…) y por **resultados de duelo** (duelos ganados consecutivos, pérdidas). Las dos tablas de la §7 son excluyentes por definición: los duelos normales se procesan solo por la tabla de duelos; los eventos cubren lo que no es un resultado de duelo individual (con la excepción documentada del paradón estándar, que se procesa como evento).

El sistema produce dos salidas: (1) un **modificador de Fuerza** (+0.15/punto, cap duro ±0.75) que entra como un mod más en el pipeline de 001 (sujeto a rendimientos decrecientes), y (2) **bonus por umbrales** (+3/+4/+5) que afectan la capa de cartas (one-shot, visibles).

Cierra el bucle abierto en 001/002: el resultado de duelo de eslabón llega como `DuelSegment` (tramo, expuesto por `DuelResult` de 001) y el evento de remate llega como causa semántica (`ShotEvent.momentum.cause`, de 002); esta feature traduce ambos a delta. Como parte del cierre de este bucle, se retira de `DuelEvent` (001) la variante `momentum` con delta numérico — residuo de la tabla de momentum de la §6 ya derogada, que habría introducido valores obsoletos junto a los vigentes de la §7 (ver ADR/research de la 003). Este ajuste de forma del evento no toca la fórmula, la clasificación de tramos ni el determinismo de `resolveDuel`. **No modifica la lógica de resolución de `resolveDuel` ni de `resolveShot`.**

---

## Escenarios de usuario y pruebas

### Historia 1 (P1) — El momentum fluye desde los eventos y los duelos, y afecta la fuerza

Como jugador, cuando marco, encadeno duelos ganados o logro un evento de impacto, quiero que mi equipo gane inercia y rinda algo mejor en los duelos siguientes (+0.15/punto con cap), para que el partido tenga rachas y "momentos".

**Aceptación:** dado un gol (+2 evento) seguido de tres duelos ganados consecutivos (+0.5 cada uno), la barra sube a +3.5; el modificador de Fuerza es clamp(0.15 × 3.5, ±0.75) = +0.525.

### Historia 2 (P1) — Los umbrales de momentum disparan efectos visibles sobre las cartas

Como jugador, cuando mi momentum cruza +3, +4 o +5, quiero ver un efecto puntual y visible (carta más fuerte, carta extra, jugador "en la zona"), para que el momentum tenga picos de drama.

**Aceptación:** al cruzar +4, robo 1 carta extra (una vez, no por posesión). Ese efecto no se repite si la barra baja y vuelve a subir a +4 sin haber bajado por debajo de +3 primero.

### Historia 3 (P2) — El momentum se degrada de forma asimétrica

Como jugador, quiero que la inercia positiva se disipe si no la alimento, y que estar "hundido" no dure para siempre, para que el momentum sea dinámico.

**Aceptación:** momentum +3 sin evento ni duelo ganado → baja a +2 tras una posesión; momentum −3 baja a −2 en cada posesión (sin necesidad de evento).

### Historia 4 (P1) — El resultado es determinista

Como desarrollador, quiero que la misma secuencia de eventos y duelos produzca siempre la misma barra y el mismo modificador.

### Casos límite

- La barra se satura en ±5; sumar por encima no la pasa.
- El modificador se satura en ±0.75 (cap duro); pactos/semillas amplificadas no lo superan.
- Barra con medios puntos: de +2.5 a +3.0 con un duelo ganado → cruza umbral +3 y dispara bonus.
- "En la zona" sobrevive aunque la barra baje: se dispara al cruzar +5 propio (o al ver al rival caer a −5) y persiste el resto del partido; es un cupo único por equipo compartido entre ambos caminos, no dos cupos independientes.
- Gol contra la marea (+3 inversión) solo aplica si tu momentum es negativo; no se suma al +2 de "Marcar gol" (ya lo incluye).
- La degradación nunca cruza el 0 (no pasa de positivo a negativo).
- Un resultado de duelo −6 aplica solo el tramo más específico de la tabla de duelos (−2, no −2 + −1.5 + −1).
- Un éxito aplastante (+6) da +1, no +1.5 (el +1 sustituye al +0.5, no lo suma), pero sí incrementa el contador de consecutivos.
- Ganar el tercer duelo consecutivo por aplastante da +2: +1 (tabla de duelos) + +1 (racha de posesión, tabla de eventos). Las tablas suman entre sí.
- Las tablas de eventos y de duelos sí se suman cuando ambas aplican al mismo momento (p. ej. racha de posesión +1 al ganar el tercer duelo, más +0.5 del duelo consecutivo).
- Un resultado de 0 no es ambiguo entre tablas: en un duelo de eslabón es "balón dividido" (`applyDuelResult`, no mueve momentum); en un remate es "paradón estándar" (`applyEvent`, +1 defensor). Mismo número, tablas y efectos distintos — la distinción la da el tipo de duelo que lo produjo, no el valor 0.

---

## Clarifications

### Sesión 2026-07-09 (resueltas contra la §7 verificada)

- **P: ¿Hay una o dos versiones del momentum en el manual?** R: **Una sola.** La §7 contiene el sistema unificado (fusión Momentum + Racha). La versión entera original y la §34 están derogadas y eliminadas.
- **P: ¿El momentum es "Fuerza" o "influencia"?** R: Modificador de **Fuerza**. NO toca atributos ni influencia (excepto "en la zona" a +5, que es la única excepción documentada). Entra como un mod más en el bruto acumulado y sí sufre rendimientos decrecientes.
- **P: ¿Hay techo de efecto?** R: **Cap duro de ±0.75** (+0.15 por punto). Se aplica ANTES de entrar en los rendimientos decrecientes. Inquebrantable incluso con semillas/pactos amplificados.
- **P: ¿De dónde sale el delta de cada evento/duelo?** R: De las dos tablas de la §7. Exclusivas entre sí: los duelos normales van solo por la tabla de duelos; todo lo demás (goles, paradas, robos, racha de posesión, paradón estándar) va por la tabla de eventos. Los resolvedores emiten la causa semántica; este sistema traduce.
- **P: ¿Los tramos de la tabla de duelos se acumulan?** R: **No.** Un resultado aplica solo el tramo más específico (−6 aplica −2, no −2+−1.5+−1). Las dos tablas entre sí sí se suman cuando ambas aplican al mismo momento.
- **P: ¿Hay barra entera o fraccional?** R: **Fraccional**, en pasos de 0.5 (duelos consecutivos suman +0.5). Rango [−5, +5]. El pipeline tolera fracciones (paso 1 de infra ya mergeado).
- **P: ¿Cómo es la degradación?** R: Asimétrica, por posesión. Positivo: −1 sin evento significativo **ni duelo ganado**. Negativo: −1 en cada posesión. Determination 16+: de −2 a 0 en 1 posesión en vez de 2. No cruza el 0.
- **P: ¿Los umbrales son sostenidos o one-shot?** R: **One-shot** al cruzar. +3 da +1 potencia a tu siguiente carta (un duelo); −3 es su simétrico mecánico (−1 potencia). +4 roba 1 carta extra (una vez); −4 es su simétrico mecánico (roba 1 carta menos). +5/−5 NO es una simetría mecánica: +5 da "en la zona" (a tu equipo) + carta "Jugada perfecta" (solo tuya); −5 NO te penaliza directamente con "Jugada perfecta" — en su lugar concede "en la zona" al equipo **rival** (ver RF-007 para el detalle completo).
- **P: ¿"En la zona" desaparece si la barra baja?** R: **No.** Es la única excepción: sobrevive el resto del partido. Es también la única excepción que toca influencia individual (+1).
- **P: ¿Se registra el máximo alcanzado?** R: Sí. Alimenta bonus post-partido (+4: +1 opción recompensa; +5: recompensa mejorada; +5 durante 5+ jugadas: +1 CA permanente al jugador "en la zona"). La 003 registra el máximo; el consumo post-partido es de otra feature.
- **P: ¿Los rasgos (Sangre fría, Precipitado, etc.) entran en la 003?** R: Solo como puntos de extensión. La lógica de los rasgos es una feature futura; la 003 deja el hueco en el tipo para que un rasgo modifique el delta o la degradación sin cambiar la firma del sistema.

---

## Requisitos

### Requisitos funcionales

- **RF-001** El sistema DEBE consumir los eventos significativos emitidos por 002 y por la capa de partido (causa semántica, sin delta) y traducir cada causa a su delta según la tabla de eventos de la §7. **`resolveDuel` no emite eventos de momentum**: el momentum de duelos de eslabón se deriva del `DuelSegment` vía RF-002 (gol +2, gol en contra −2, contra la marea +3 si negativo, técnica especial +1, parada épica +1, mano a mano +1, pressing +1, racha de posesión +1, paradón estándar +1 defensor). **La distinción entre tabla de eventos y tabla de duelos NO la hace el valor del resultado, sino el tipo de duelo que lo produjo:** los duelos de eslabón van exclusivamente por la tabla de duelos (RF-002, vía `applyDuelResult(state, segment: DuelSegment)`); los duelos tiro-vs-portero van por la tabla de eventos exclusivamente cuando el resultado es gol o paradón estándar (vía `applyEvent(state, cause: MomentumEventCause)`). Ambas funciones aceptan tipos de parámetro disjuntos; no existe ni debe existir una función que reciba el resultado numérico crudo y decida la tabla inspeccionando su valor (un resultado de 0 es "balón dividido" en un duelo de eslabón — no mueve momentum — y "paradón estándar" en un remate — +1 defensor —, mismo número, tablas y efectos distintos).
- **RF-002** El sistema DEBE procesar cada resultado de duelo de eslabón según la tabla de duelos de la §7: **éxito aplastante (≥+6) → +1 (sustituye al +0.5, no lo suma)**; duelo ganado consecutivamente → +0.5; balón dividido → 0; pérdida simple (−1..−2) → −1 y reset de contador; pérdida con desventaja (−3..−5) → −1.5; contragolpe devastador (−6) → −2. Un resultado aplica **solo el tramo más específico** (sin acumular tramos). El éxito aplastante incrementa el contador de consecutivos igual que cualquier duelo ganado; solo cambia su delta. Las dos tablas sí se suman cuando ambas aplican por vías distintas.
- **RF-003** El sistema DEBE mantener una barra **fraccional** por equipo, en pasos de 0.5, saturada en [−5, +5], empezando en 0.
- **RF-004** El sistema DEBE calcular el modificador de Fuerza como `clamp(0.15 × momentum, −0.75, +0.75)` (**cap duro**, inquebrantable incluso con amplificadores).
- **RF-005** El modificador DEBE entrar como un mod situacional más en el bruto acumulado de 001 (`applyDiminishing`), sujeto a rendimientos decrecientes. No se aplica íntegro.
- **RF-006** El sistema DEBE mantener un **contador de duelos ganados consecutivos** por equipo, que se resetea al perder un duelo (cualquier resultado ≤ −1).
- **RF-007** El sistema DEBE detectar el cruce de **umbrales** y emitir el efecto one-shot correspondiente. **Los umbrales −3 y −4 SÍ son mecánicamente simétricos a sus positivos** (mismo tipo de efecto, signo invertido, mismo equipo afectado): +3 → tu siguiente carta +1 potencia (un duelo) / −3 → tu siguiente carta −1 potencia; +4 → robas 1 carta extra (una vez) / −4 → robas 1 carta menos. **El umbral +5/−5 NO es una simetría mecánica: cambia el sujeto del efecto.** +5 (tu propia barra) → tu equipo recibe DOS efectos: (a) un jugador propio "en la zona" (+1 influencia individual, resto del partido, sobrevive al descenso de barra), y (b) se desbloquea tu carta "Jugada perfecta" (potencia 6, 1 uso). −5 (tu propia barra cae a −5) → tu equipo NO recibe ningún efecto negativo propio directo de "Jugada perfecta"; en su lugar, el equipo **rival** recibe un jugador "en la zona" (el mismo efecto (a), pero atribuido al rival, no a ti) — el efecto (b) ("Jugada perfecta") NO se concede al rival por tu −5: esa carta solo la desbloquea el +5 propio de cada equipo. Ver `data-model.md` (`ThresholdEffect.enteredTheZone.triggeredBy`) para el modelo de cupo compartido de "en la zona".
- **RF-008** Un umbral one-shot solo se dispara **al cruzar** por debajo del umbral inmediatamente inferior y volver a subir. Los umbrales +3, −3, +4 y −4 se re-disparan cada vez que se cruzan de nuevo bajo esa condición. El umbral ±5 tiene dos efectos con reglas distintas (ver RF-007 para qué equipo recibe cada uno): la carta "Jugada perfecta" es consumible de 1 uso y se re-desbloquea cada vez que la propia barra cruza +5 de nuevo bajo esa condición, igual que +3/+4 — el −5 propio nunca la desbloquea (ni para ti ni para el rival). El jugador "en la zona" es la única excepción de todo el sistema: es un cupo único por partido y por equipo (el equipo beneficiado, no el que cruza), concedido por el primero de dos caminos independientes que ocurra (la propia barra llega a +5, o la barra rival cae a −5) — una vez concedido, no se re-dispara ni se reasigna por ninguno de los dos caminos, ni siquiera si el otro camino también ocurre más tarde en el mismo partido.
- **RF-009** El sistema DEBE registrar el **máximo de momentum alcanzado** por equipo en el partido (no baja con degradación). El consumo para bonus post-partido es de otra feature; la 003 solo registra.
- **RF-010** El sistema DEBE registrar cuántas jugadas **consecutivas** se ha mantenido en +5 exacto (`playsAtPeakPositive`), para el bonus post-partido de +1 CA permanente con 5+ jugadas. El contador sube en +1 por cada jugada en la que `bar === 5` exacto. Al bajar de +5 (cualquier valor < 5) el contador se resetea a **0**, no se congela: "se mantuvo en +5 durante 5+ jugadas" (manual §7) exige continuidad, así que si la barra baja y vuelve a subir a +5 más tarde, empieza una racha nueva desde 0 — dos rachas fragmentadas de 3 jugadas en +5 NO deben sumar 6 y disparar el bonus de 5+.
- **RF-011** El sistema DEBE exponer una operación de **degradación por posesión**, asimétrica: positivo −1 sin evento significativo ni duelo ganado; negativo −1 en cada posesión. Determination media 16+ → de −2 a 0 en 1 posesión. La degradación nunca cruza el 0.
- **RF-012** "Gol contra la marea" (+3 inversión) DEBE aplicarse **solo** si el momentum del equipo es negativo al marcar. No se suma al +2 de gol (ya lo incluye).
- **RF-013** El sistema DEBE ser **determinista**: la misma secuencia de eventos y posesiones produce la misma barra. Cualquier aleatoriedad (si Determination la introduce) entra por el `Rng` sembrado.
- **RF-014** El sistema NO DEBE modificar la lógica de resolución de `resolveDuel` ni de `resolveShot` (fórmula, clasificación de tramos, determinismo). Su salida (el modificador + los efectos de umbral) se pasa a los resolvedores por el slot de mods existente, desde la capa de partido (004). **Excepción documentada:** como parte del cierre del bucle 001→003, se retira de `DuelEvent` la variante `momentum` con delta numérico (residuo de la tabla de la §6 derogada); es un cambio de forma del evento emitido, no de la lógica de resolución que este RF protege.
- **RF-015** El sistema vive en `packages/core` y respeta `core-determinism-guard`.
- **RF-016** El sistema DEBE **reutilizar** `DuelSegment`/`DuelResult` (001) y el discriminated union `ShotEvent` (002) para consumirlos, y `applyDiminishing` de 001 (para el modificador). No reimplementarlos. `applyEvent` acepta una única forma de entrada (causa semántica); no existe una unión `{cause} | {delta}`.
- **RF-017** El sistema DEBE dejar puntos de extensión para **rasgos** (Sangre fría, Precipitado, Defensor implacable, Organizador) sin implementar su lógica en v1. El tipo debe prever que un rasgo pueda modificar un delta o una regla de degradación.

### Entidades clave

- **MomentumState** — barra fraccional por equipo (2 valores en [−5, +5]); contador de duelos consecutivos ganados por equipo; máximo alcanzado por equipo; contador de jugadas en +5 por equipo; registro de umbrales cruzados (para one-shot); jugador "en la zona" que beneficia a este equipo (cupo único por partido, concedido por su propio +5 o por el −5 del equipo rival — ver RF-007/RF-008; sobrevive al descenso de la barra).
- **MomentumEventTable** — dato que mapea cada causa de evento a su delta (gol +2, contra la marea +3…). Vive en `packages/content` como dato validado con Zod.
- **DuelMomentumTable** — dato que mapea cada uno de los seis tramos de resultado de duelo a su delta: aplastante (≥+6) → +1 (sustituye al +0.5 de "ganado", no se suma); ganado consecutivo → +0.5; balón dividido (0) → no mueve; pérdida simple (−1..−2) → −1 y reset del contador; pérdida con desventaja (−3..−5) → −1.5; contragolpe devastador (−6) → −2. Vive en `packages/content`.
- **MomentumModifier** — el valor `clamp(0.15 × momentum, ±0.75)` que se entrega al pipeline de mods de 001.
- **ThresholdEffect** — discriminated union de los efectos de umbral: +1/−1 potencia (±3); robar carta extra/menos (±4); "en la zona" (cupo único por equipo, disparado por +5 propio o −5 rival); "Jugada perfecta" (solo por +5 propio, no tiene contraparte negativa).

---

## Criterios de éxito (medibles)

- **CE-001 (determinismo):** el 100% de las secuencias repetidas producen la misma barra, el mismo modificador y los mismos efectos de umbral.
- **CE-002 (saturación de barra):** ninguna combinación de eventos/duelos lleva la barra fuera de [−5, +5].
- **CE-003 (cap de Fuerza):** el modificador nunca supera ±0.75 en valor absoluto, para ningún valor de barra ni amplificador.
- **CE-004 (asimetría de degradación):** el momentum negativo se recupera hacia 0 al menos tan rápido como se disipa el positivo. Verification: secuencias de posesiones sin evento.
- **CE-005 (reutilización):** el sistema no contiene su propia copia de `applyDiminishing` ni del union de eventos; los importa. `resolveDuel`/`resolveShot` no se modifican (verificable con diff/grep).
- **CE-006 (tramo más específico):** un resultado de duelo −6 da exactamente −2, no −3.5 (acumulado de tramos). Un éxito aplastante da exactamente +1, no +1.5. Verificable con casos unitarios.
- **CE-007 (resolveDuel no emite momentum):** `resolveDuel` no emite ningún evento de momentum; el momentum de duelos de eslabón se deriva exclusivamente del `DuelSegment`. Verificable con:
  ```bash
  grep -n "type: 'momentum'" packages/core/src/duel/events.ts && echo "❌ resolveDuel emite momentum" || echo "✅ CE-007 OK"
  ```
  El comando DEBE salir por la rama `✅`.
- **CE-008 (resolveShot sí emite momentum):** `resolveShot` DEBE seguir emitiendo eventos de momentum con la forma `{lado, causa}` para gol y paradón estándar (la excepción del remate documentada en la §7). Verificable con:
  ```bash
  grep -c "type: 'momentum'" packages/core/src/shot/events.ts
  ```
  El comando DEBE devolver **≥3** — hoy son exactamente 3: `cause:'goal'` (gol), `cause:'goalOnRebound'` (gol con rebote), `cause:'greatSave'` (paradón estándar, que en la §7 da +1 al defensor). Si el conteo baja de 3, alguna de las tres ramas de `emitShotEvents` dejó de emitir su evento de momentum.
- **CE-009 (exclusividad de tablas, un caso por tramo):** ningún resultado de duelo de eslabón (los seis tramos de `DuelSegment`) produce una entrada en la tabla de eventos; el remate (gol, paradón estándar) sí produce una entrada en la tabla de eventos y nunca en la tabla de duelos. Verificable con un caso de test por tramo de `DuelSegment` más un caso por causa de remate.
- **CE-010 (umbrales one-shot):** cruzar +3, −3, +4 o −4 dispara el efecto una vez; repetir el cruce tras haber bajado por debajo del umbral inmediatamente inferior lo dispara de nuevo. La carta "Jugada perfecta" sigue la misma regla de re-disparo pero SOLO existe para +5 propio (no tiene contraparte en −5, ni propia ni para el rival). El jugador "en la zona" es la única excepción de todo el sistema: cupo único por partido y por equipo (el equipo beneficiado), concedido por el primero de dos caminos que ocurra (+5 propio o −5 rival), sin re-dispararse por ninguno de los dos caminos una vez concedido.
- **CE-011 (máximo no baja):** el máximo alcanzado es ≥ el máximo anterior tras cualquier operación.
- **CE-012 (contador de jugadas en +5 es continuo, no acumulado):** `playsAtPeakPositive` sube en +1 solo mientras `bar === 5` exacto; se resetea a 0 en la primera jugada en que `bar !== 5`, incluso si vuelve a subir a +5 después. Verificable con: (a) 3 jugadas consecutivas en +5 → contador en 3; (b) baja a +4.5 en la jugada 4 → contador en 0; (c) sube a +5 de nuevo y se mantiene 2 jugadas → contador en 2, no en 5 (3+2). Dos rachas fragmentadas nunca deben sumar para alcanzar el umbral de "5+ jugadas" del bonus post-partido.
- **CE-013 (degradación no cruza 0):** la degradación nunca lleva una barra positiva a negativa ni viceversa.
- **CE-014 (jerarquía preservada):** en simulación, un jugador medio con momentum +5 (fuerza sostenida ~+1.10) sigue perdiendo contra un jugador élite con momentum −5 (fuerza neta ~+2.75). El momentum importa pero no fabrica calidad.

---

## Suposiciones y fuera de alcance

**Suposiciones:** los eventos de 001/002 están disponibles con su causa semántica y lado; el pipeline tolera fracciones (paso 1 de infra); existe el atributo Determination en el modelo de jugador (o doble); `applyDiminishing` acepta fracciones.

**Fuera de alcance:**
- La **cadena de posesión** que secuencia duelos y dispara la degradación (feature 004). La 003 expone la operación; la 004 la llama.
- Los **bonus post-partido** (consumo del máximo alcanzado para recompensas). La 003 solo registra el máximo y las jugadas en +5.
- La **lógica de rasgos** (Sangre fría, Precipitado, etc.). La 003 deja los puntos de extensión en el tipo.
- La **integración visual** de la barra y los efectos de umbral (capa de UI).
- Energía y fatiga (sistemas separados, features propias).
- La carta "Jugada perfecta" como dato del catálogo (la 003 emite el evento de desbloqueo; el catálogo es otra feature).