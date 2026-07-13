# Especificación — Economía de cartas

**Feature branch:** `005-economia-cartas`
**Estado:** Clarificada (lista para `/speckit.plan`)
**Creada:** 2026-07-10
**Fuente de verdad:** manual §2 (Estructura), §3 (Cadena de Ataque), §4 (Defensa) — en `doc/`
**Depende de:** 001 (resolveDuel), 002 (resolveShot), 003 (momentum), 004 (cadena de posesión)

---

## Resumen

La economía de cartas convierte el motor de partido en un juego de cartas. Hasta ahora `playMatch` pasaba **stubs** a los resolvedores; a partir de aquí, cada duelo consume una carta real de una mano real, robada de sub-mazos que **se agotan y nunca se rebarajan**.

Tres sub-mazos (ataque 18-20, defensa 10-12, compartido 6-8), una mano única de 7 cartas, robo asimétrico (2 ofensivas al atacar, 1 defensiva al defender), y las tres válvulas para cuando te quedas seco: improvisar, reconvertir o instantes.

**El agotamiento es la mecánica central**, no un caso límite. Las cartas jugadas salen del juego. La única forma de reciclar es descartar por exceso de mano, y eso devuelve al fondo.

---

## Alcance

**Dentro:**
- Los tres sub-mazos, el barajado determinista, y el agotamiento sin rebarajado.
- Mano única de 7, compartida entre fases, con descarte por exceso al fondo del sub-mazo.
- Robo asimétrico al cambiar de posesión (ambos equipos a la vez).
- Mulligan (máx. 1 por posesión, descartar ≤2 y robar 2, la mano no crece).
- Set del portero: regeneración por posesión defensiva, umbrales de atributo, uso único de las superiores.
- Las tres opciones sin carta de la fase: improvisada (potencia 0), reconversión (potencia ≥2, mitad, atributo natural de la fase), instantes.
- Instantes: pre-revelado, adicionales a la carta de acción, máx. 1 por duelo y por jugador.
- Repliegue táctico (+2 defensa base, cuesta 1 carta, máx. 1 por posesión rival).
- Consumo del `drawsCard` del éxito aplastante, que la 004 declaró sin implementar.
- Sustitución de los stubs de carta en `playMatch`.

**Fuera:**
- **Construcción del mazo desde la plantilla** (qué cartas aporta cada jugador según rareza y rol). La 005 recibe los sub-mazos ya construidos. El suelo mínimo (14 ataque / 8 defensa) se valida como **precondición**, no se rellena aquí.
- El **catálogo de cartas concretas** (las 182 del manual). La 005 usa el esquema y dobles de prueba.
- **Efectos individuales de cada carta** (Amague, Visión periférica, Recorte…). La 005 implementa el *sistema* de instantes, no sus efectos. Registro de handlers vacío.
- **Sustituciones** (retirar cartas del jugador sustituido del sub-mazo).
- La **IA de decisión** (qué carta jugar, qué descartar, cuándo mulligan/repliegue). La 005 expone las operaciones; el agente que decide es otra feature.
- Tarjetas, faltas y lesiones.

---

## Escenarios de usuario

### Historia 1 (P1) — Los mazos se agotan y eso importa

Como jugador, quiero que gastar cartas tenga consecuencias irreversibles, para que decidir cuándo quemar una buena carta sea tenso.

**Aceptación:** una carta jugada no vuelve al mazo. Tras N posesiones atacantes, el sub-mazo de ataque se vacía y el equipo debe improvisar o reconvertir.

### Historia 2 (P1) — La mano es un recurso compartido entre atacar y defender

Como jugador, quiero elegir si conservo una carta defensiva para la posesión rival o hago hueco para ofensivas mejores.

**Aceptación:** la mano es única, máximo 7; al exceder, descarto a mi elección y lo descartado va al fondo de su sub-mazo.

### Historia 3 (P1) — Quedarse sin cartas nunca bloquea, pero perjudica

Como jugador, cuando no tengo cartas de la fase actual, quiero tres salidas: improvisar gratis, reconvertir gastando, o tirar de instantes.

**Aceptación:** improvisar da potencia 0 y usa el atributo natural de la zona; reconvertir da mitad de potencia (solo desde ≥2) y usa el atributo natural **de la fase actual**, no el de la carta.

### Historia 4 (P2) — El portero tiene su propio set, que se regenera

Como jugador, quiero que mi portero tenga cartas según su calidad, y que un rebote le obligue a bajar de nivel.

**Aceptación:** el set se regenera completo al inicio de cada posesión defensiva; Parada básica es ilimitada; cada superior se usa una vez por posesión.

### Casos límite

- Sub-mazo agotado: robar no falla, simplemente no roba nada.
- Mulligan pidiendo 2 con 1 carta en el sub-mazo: roba 1.
- Mano llena (7) y toca robar 3: roba 3, descarta 3 al fondo de sus sub-mazos.
- Reconvertir una carta de potencia 1: **no permitido** (valdría 0, dominada por improvisar).
- Segundo remate en la misma posesión tras rebote: el portero ya gastó su carta superior, solo le queda Parada básica.
- Repliegue con la mano vacía: no permitido (cuesta 1 carta).
- Instante sobre una técnica especial que suma potencia: no se apila.

---

## Clarifications

### Resueltas contra §2/§3/§4 (sesión 2026-07-10)

- **P: ¿Los mazos se rebarajan al agotarse?** R: **No, nunca.** Carta jugada sale del juego. Solo el descarte por exceso de mano (o mulligan) vuelve al fondo del sub-mazo. El agotamiento es mecánica central; sin él, toda la sección "Jugar sin cartas" sería código muerto.
- **P: ¿Quién roba y cuándo?** R: Al cambiar la posesión, **ambos equipos a la vez**, según su nuevo rol. El nuevo atacante: 2 ofensivas + 1 compartida. El nuevo defensor: **1 defensiva** + 1 compartida. El robo es asimétrico porque los mazos lo son (18-20 vs 10-12) y el consumo es simétrico.
- **P: ¿El portero roba cartas?** R: **No.** Su set es separado y se **regenera completo** al inicio de cada posesión defensiva. Parada básica (pot. 3) ilimitada. Superiores según atributo, **una vez por posesión** cada una: Blocaje (Handling 13+, pot. 4), Despeje de puños (Aerial Reach 15+, pot. 4), Estirada (Reflexes 15+, pot. 5), Achique (One on Ones 17+, pot. 6).
- **P: ¿Qué suma una carta reconvertida?** R: Potencia a la mitad (redondeada abajo) y el **atributo natural de la fase actual**, NO el de la carta original. Solo desde potencia ≥ 2 (potencia 1 daría 0, dominada por improvisar).
- **P: ¿Cómo funciona el mulligan?** R: Al inicio de tu posesión, descartas hasta 2 y robas 2 del sub-mazo de la fase actual. **Máximo 1 por posesión.** La mano no crece. Descartadas al fondo. Si el sub-mazo está corto, robas lo que haya.
- **P: ¿Cómo funcionan los instantes?** R: Del mini-mazo compartido. Se juegan en **pre-revelado** (paso 2 de la secuencia del §6), **adicionales** a la carta de acción. No consumen jugada. **Máx. 1 por duelo y por jugador** (ambos pueden). No se apilan sobre técnicas especiales que sumen potencia.
- **P: ¿Qué pasa con un instante al jugarse — sale del juego o va al fondo?** R: **Sale del juego** (RF-004 aplica igual que a cualquier carta). No vuelve al fondo del mini-mazo compartido. Razón de balance: el mini-mazo compartido tiene 6-8 cartas y se roba 1 por cambio de posesión (~16-20 por partido), así que se agota antes que el ofensivo — deliberadamente. Los instantes son ~7 momentos de trampa en todo el partido; si volvieran al fondo nunca se agotaría el mini-mazo y dejarían de ser recurso escaso (Amague cada duelo anularía el mind-game de carril). La distinción jugado/descartado de RF-004 también se difuminaría.
- **P: ¿Cuánto sube el repliegue?** R: **+2 a la fuerza defensiva base** durante toda la posesión rival. Cuesta 1 carta de la mano. Máx. 1 por posesión rival. Entra como **mod situacional** (sujeto a rendimientos decrecientes).
- **P: ¿Los cálculos de improvisación usan atributo bruto?** R: **No.** Usan la influencia comprimida del §6 (−4..+4). El ejemplo fósil de la §3 (fuerza 18) fue corregido.
- **P: ¿Qué aporta la 005 a la issue #3 y qué queda pendiente?** R: La 005 aporta el dato de origen de carta del disparo (si vino de una carta Long Shots) — ese bloqueante se retira. Los otros dos siguen pendientes: (a) el contador acumulativo de disparos lejanos fallados en `MatchState` y (b) la propagación de `shotZone` desde `resolveShot`. Ambos son orquestación/transición, no economía de cartas (Principio 7). Propagar `shotZone` no viola RF-025 (ese requisito protege la lógica de resolución, no la forma del output — igual que T047 cambió eventos de `resolveDuel` sin violar la equivalente), pero hacerlo aquí sería alcance horizontal. La issue se reetiquetará al cerrar la 005.
- **P: ¿"sub-mazo compartido" o "mini-mazo compartido"?** R: **"mini-mazo compartido"** en prosa (spec, docs) — es el término del manual (§2, §3) y comunica que tiene 6-8 cartas frente a 18-20 y 10-12 ("mini" lleva información de diseño). En código: `sharedDeck` con `type: 'shared'`, uniforme con los otros dos `SubDeck`. Regla general para esta feature: la prosa sigue al manual; si un nombre del manual resulta ser malo, se cambia allí primero.

---

## Requisitos funcionales

### Mazos y agotamiento

- **RF-001** El sistema DEBE mantener tres sub-mazos por equipo: ataque (18-20), defensa (10-12), compartido (6-8). Los recibe ya construidos.
- **RF-002** El sistema DEBE validar como **precondición** el suelo mínimo (ataque ≥14, defensa ≥8) y fallar ruidosamente si no se cumple. No rellena.
- **RF-003** El barajado DEBE ser determinista (Fisher-Yates con el `Rng` sembrado, dividido con `split()`).
- **RF-004** Una carta **jugada** DEBE salir del juego permanentemente. **No hay pila de descartes ni rebarajado.**
- **RF-005** Una carta **descartada** (exceso de mano o mulligan) DEBE volver **al fondo de su sub-mazo correspondiente**.
- **RF-006** Robar de un sub-mazo agotado NO DEBE fallar: devuelve las cartas que haya (posiblemente ninguna).

### Mano

- **RF-007** La mano es **única y compartida** entre fases, máximo **7** cartas.
- **RF-008** La mano inicial es 5 ofensivas + 2 defensivas.
- **RF-009** Al exceder 7 tras robar, el sistema DEBE exigir descarte hasta 7. Las descartadas van al fondo de su sub-mazo.

### Robo

- **RF-010** Al cambiar de posesión, **ambos equipos roban a la vez**: el nuevo atacante 2 ofensivas + 1 compartida; el nuevo defensor **1 defensiva** + 1 compartida.
- **RF-011** El sistema DEBE implementar el **mulligan**: máx. 1 por posesión, descartar ≤2, robar 2 del sub-mazo de la fase actual, la mano no crece.
- **RF-012** El sistema DEBE consumir el `drawsCard` del **éxito aplastante** que la 004 declaró en `PossessionTransition` sin implementar. **El test de no-implementación de la 004 DEBE romper al cablearlo.**

### Portero

- **RF-013** El set del portero NO se roba. Se **regenera completo** al inicio de cada posesión defensiva de su equipo. "Regenerar completo" significa: (a) reconstruir `available` evaluando los cuatro umbrales de atributo desde cero, y (b) limpiar todas las marcas de uso (`usedThisPossession = ∅`). No es resetear un flag: es reconstruir el set entero.
- **RF-014** Parada básica (potencia 3) siempre presente, **uso ilimitado**.
- **RF-015** Las cartas superiores se añaden según umbral de atributo y tienen **un uso por posesión**. El set completo es **cinco cartas**: Parada básica (RF-014) + las cuatro superiores a continuación. Si el portero no alcanza ningún umbral, solo dispone de Parada básica. Si los alcanza todos, tiene las cinco:

  | Carta             | Atributo clave | Umbral | Potencia |
  |-------------------|---------------|--------|----------|
  | Blocaje           | Handling      | ≥ 13  | 4        |
  | Despeje de puños  | Aerial Reach  | ≥ 15  | 4        |
  | Estirada          | Reflexes      | ≥ 15  | 5        |
  | Achique           | One on Ones   | ≥ 17  | 6        |

  La comprobación de "un uso" se hace contra `usedThisPossession`: si la carta ya está en ese conjunto, no está disponible.

### Jugar sin carta de la fase

Los tres caminos son mutuamente distinguibles: **improvisar** no consume ninguna carta de la mano; **reconvertir** sí consume la carta reconvertida; **instantes** se juegan de forma adicional a la carta de acción (no la sustituyen).

- **RF-016** **Improvisar:** potencia 0, no gasta carta, siempre disponible. Recibe la **intención del jugador** como parámetro (`'pass' | 'cross' | 'shot' | 'tackle'`) — el motor ejecuta, no elige. Debe validar que la intención es legal en la franja actual y fallar ruidosamente si no (centrar desde Defensa es ilegal). La IA que decide qué intención elegir es RF-027 (fuera de alcance de la 005). Tabla de atributos por zona×intención (seis filas):

  | Franja    | Intención | Atributo  | Nota                                                    |
  |-----------|-----------|-----------|----------------------------------------------------------|
  | Defensa   | pase      | Passing   | Avanza 1 franja                                          |
  | Medio     | pase      | Passing   | Avanza 1 franja                                          |
  | Ataque    | centro    | Crossing  | —                                                        |
  | Ataque    | disparo   | Finishing | −3 distancia; Long Shots ≥16 reduce en 2, ≥18 elimina   |
  | Área      | remate    | Finishing | Sin penalización de distancia                            |
  | (defensa) | cuerpo    | Tackling  | —                                                        |

  Long Shots **mitiga la penalización** de disparo desde Ataque pero **no es el atributo del disparo** — el atributo es siempre Finishing.
- **RF-017** **Reconvertir:** solo cartas de potencia **≥ 2**. Potencia a la mitad con `Math.floor(potencia / 2)` — potencia impar redondea abajo (pot. 3 → 1, pot. 5 → 2). Usa el **atributo natural de la fase actual** (`naturalAttribute`), **no el `atributoClave` de la carta** — un delantero (carta con `atributoClave: 'Dribbling'`) reconvertida en fase defensiva usa Tackling, no Dribbling. Gasta la carta.
- **RF-018** Solo se pueden reconvertir cartas de **potencia ≥ 2**. Potencia 0 y 1 son ilegales (potencia 0 existe en el esquema Zod para cartas de utilidad pura; potencia 1 reconvertida daría 0 — ambas dominadas por improvisar y eliminadas de las reglas, §3). La API expone dos funciones: `canConvert(card): boolean` (consulta sin efectos, para construir la lista de acciones legales) y `convertCard(card): PlayedCard` (lanza si `card.potencia < 2` — una llamada con carta ilegal es un bug del llamador, no una opción rechazada en runtime).
- **RF-019** **Instantes:** se juegan en pre-revelado, adicionales a la carta de acción, no consumen jugada. **Máx. 1 por duelo y por jugador.** No se apilan sobre técnicas especiales que sumen potencia. Un instante jugado **sale del juego** (RF-004 aplica sin excepción; no vuelve al fondo del mini-mazo compartido).

### Repliegue

- **RF-020** El **repliegue táctico** cuesta 1 carta de la mano (cualquier tipo), da **+2 a la fuerza defensiva base** durante toda la posesión rival, máx. 1 por posesión. Entra como **mod situacional** (pasa por `applyDiminishing`).
- **RF-021** No se puede replegar con la mano vacía.

### Integración

- **RF-022** El sistema DEBE sustituir los **stubs de carta** de `playMatch` (`makeStubShotInput` y equivalentes) por la carta real jugada desde la mano.
- **RF-023** El sistema DEBE ser **determinista**: mismo estado inicial y semilla ⇒ mismo barajado, mismos robos, mismo partido.
- **RF-024** El sistema DEBE **reutilizar** `resolveDuel`, `resolveShot`, `updateMomentum`, `applyDiminishing` y el orquestador de la 004. No reimplementarlos.
- **RF-025** El sistema NO DEBE modificar la lógica de resolución de `resolveDuel` ni `resolveShot`.
- **RF-026** Vive en `packages/core`, respeta `core-determinism-guard`. Las cartas son **datos Zod** en `packages/content` (skill `card-authoring`).
- **RF-027** El sistema DEBE dejar puntos de extensión, **sin lógica en v1**, para: efectos individuales de carta (registro de handlers vacío), sustituciones, construcción de mazo desde plantilla, e IA de decisión.

---

## Entidades clave

- **SubDeck** — cartas restantes (ordenadas), su tipo (`attack`/`defense`/`shared`). No tiene pila de descartes.
- **Hand** — hasta 7 cartas, mezcla de tipos.
- **GoalkeeperSet** — cartas disponibles esta posesión, con marca de uso por carta superior. Se regenera.
- **CardEconomyState** — los tres `SubDeck` por equipo, la `Hand` por equipo, el `GoalkeeperSet` por equipo, y flags por posesión (mulligan usado, repliegue usado).
- **PlayedCard** — discriminated union: `{kind: 'natural', card}` | `{kind: 'converted', card, effectivePower, naturalAttribute}` | `{kind: 'improvised', power: 0, naturalAttribute}`.
- **Instant** — carta del mini-mazo compartido jugada en pre-revelado.

---

## Criterios de éxito

- **CE-001 (determinismo):** misma semilla ⇒ mismo barajado, mismos robos, mismo partido completo.
- **CE-002 (no rebarajado):** tras jugar N cartas, el total de cartas del sub-mazo + mano + jugadas es constante y las jugadas nunca reaparecen. Verificable con property test sobre secuencias arbitrarias.
- **CE-003 (agotamiento real):** en simulación de partidos completos, el sub-mazo de ataque se vacía en un porcentaje no trivial de partidos (>20%). Si nunca se vacía, la mecánica de "jugar sin cartas" es inalcanzable y el robo está mal calibrado.
- **CE-004 (relojes de agotamiento simétricos):** el sub-mazo defensivo NO se agota sistemáticamente antes que el ofensivo. Verifica que el robo asimétrico (2 vs 1) cumple su propósito.
- **CE-005 (mano acotada):** la mano nunca supera 7 cartas en ningún punto de ninguna secuencia.
- **CE-006 (reconversión correcta):** una carta de potencia 4 reconvertida da potencia 2 y suma el atributo **natural de la fase actual**, no el de la carta. Verificable con caso unitario que compruebe explícitamente qué atributo se sumó.
- **CE-007 (potencia 1 no reconvertible):** intentar reconvertir potencia 1 falla ruidosamente.
- **CE-008 (portero: uso único):** tras usar Estirada, un segundo remate en la misma posesión solo dispone de Parada básica.
- **CE-009 (repliegue como mod):** el +2 del repliegue entra en el array de mods y pasa por `applyDiminishing`; no se aplica íntegro.
- **CE-010 (jerarquía con improvisación):** un delantero élite improvisando (Fuerza 4) sigue siendo peligroso contra un portero mediocre (Fuerza 2); un delantero mediocre improvisando (Fuerza −1) no lo es. **Improvisar no salva a los malos.**
- **CE-011 (drawsCard consumido):** el éxito aplastante roba 1 carta. Verificable con test de integración: un crushing success añade una carta a la mano del atacante. **Corrección post-implementación:** la premisa original de este criterio ("el test de no-implementación de la 004 rompe al cablearlo") era incorrecta — `crushingAdvance` en la 004 nunca llevó un campo de dato no consumido tipo `drawsCard` (a diferencia de `disadvantageLoss`/`devastatingCounter`, que sí llevan `transitionBonus`/`zoneBoost` y sí tienen su test de no-implementación en `possession.test.ts`). No existía tal test que romper; `drawOnCrushingSuccess` es un mecanismo enteramente nuevo de RF-012, sin precedente en la 004. Confirmado por git log: ningún commit introdujo jamás un campo `drawsCard`.
- **CE-012 (reutilización):** no reimplementa nada de 001/002/003/004. Verificable con grep sobre `packages/core/src/cards/`: los términos `triangular`, `computeBand`, `sampleTriangular`, `-6`, `+6` (umbrales de incertidumbre) y `resolveShot` no deben aparecer como implementación propia. Comando: `grep -rn "triangular\|computeBand\|sampleTriangular" packages/core/src/cards/` debe dar vacío.
- **CE-013 (resolvedores intactos):** `git diff` no muestra cambios en `resolveDuel.ts` ni `resolveShot.ts`.
- **CE-014 (calibración intacta):** con cartas reales en vez de stubs, las bandas de 001/002 y los goles/partido de la 004 (2.82, banda [2.0, 4.5]) **siguen dentro de rango**. Si se mueven, diagnosticar antes de tocar constantes: las potencias de las cartas stub podrían diferir de las reales.

---

## Suposiciones y fuera de alcance

**Suposiciones:** los sub-mazos llegan construidos y validados; existen los atributos Handling, Aerial Reach, Reflexes, One on Ones; el `Rng` splittable está disponible; el orquestador de la 004 acepta la carta real donde hoy pone un stub.

**Nota de integración (issue #3 — bonus disparo lejano):** la 005 **retira uno de los tres bloqueantes** de la issue #3: con cartas reales, el dato de origen de carta (si el disparo vino de una carta de Long Shots) existe por primera vez. Los otros dos bloqueantes quedan fuera de alcance de esta feature (Principio 7):
- **Pendiente:** contador acumulativo de disparos lejanos fallados que persista entre posesiones en `MatchState` — es orquestación y estado de partido.
- **Pendiente:** propagación de `shotZone` desde `resolveShot` — es output de transición, no economía de cartas.
La issue #3 se reetiquetará de `bloqueada-por-cartas` a `bloqueada-por-transicion-acumulativa` al cerrar esta feature.