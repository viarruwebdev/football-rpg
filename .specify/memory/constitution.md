# Constitución — Football RPG

Este documento es la **ley del proyecto**. Toda especificación, plan, tarea e implementación —los generen agentes o el autor— debe cumplirla. En caso de conflicto, esta constitución prevalece sobre cualquier otra conveniencia, sugerencia de un agente o atajo. `AGENTS.md` operacionaliza estos principios para el día a día; el **manual de diseño (/doc/Football RPG)** es la fuente de verdad de *las reglas del juego*; esta constitución es la fuente de verdad de *cómo se construye*.

Cada principio está redactado para ser **verificable**: si no puedes comprobar que se cumple, no está cumplido.

- **Versión:** 1.0.0
- **Ratificada:** 2026-07-06
- **Última enmienda:** 2026-07-06

---

## Contexto vinculante

Football RPG es un **roguelite de fútbol por cartas contra IA**, de **un solo jugador**, que corre **íntegramente en el navegador**. Lo desarrolla **una persona con ayuda de agentes de IA**. Es de uso personal: no hay equipo, ni usuarios externos, ni requisitos de producción a gran escala. Las prioridades, en orden, son: (1) preservar los invariantes que hacen el proyecto testeable y balanceable; (2) que un agente pueda avanzar sin romper el diseño; (3) que el autor no se agote por exceso de alcance.

---

## Principios fundamentales

### 1. El núcleo del juego es puro y determinista

El motor (`packages/core`) es una función pura de la forma `reducir(estado, acción, rng) → { estado, eventos }`.

- **DEBE** producir los mismos `eventos` y el mismo `estado` para los mismos inputs, siempre.
- **NO DEBE** contener, en ninguna ruta de `packages/core`: `Math.random`, `Date.now`/`Date`, `fetch`/red, acceso a `window`/`document`/DOM, lectura/escritura de disco, ni ninguna otra fuente de no-determinismo o efecto secundario.
- Toda aleatoriedad **DEBE** entrar por un PRNG **sembrado y explícito**, pasado como argumento a través del árbol de decisiones. Nunca un generador global.
- El motor **NO DEBE** importar nada de `apps/game` ni de la capa de UI. Las dependencias van solo hacia dentro: `content → core ← app ← ui`.

*Justificación:* este único principio nos regala tests, replays reproducibles, depuración por semilla, balance por simulación masiva y libertad de cambiar de framework de UI. Es la columna vertebral del proyecto.

*Cómo se verifica:* el mismo caso ejecutado dos veces con idéntica semilla produce logs de eventos idénticos (golden replay). Un lint/revisión rechaza `Math.random|Date.now|fetch|window|document` dentro de `packages/core`.

### 2. Local-first, sin backend

El producto es una **SPA** que se ejecuta y persiste **en el cliente**.

- La persistencia **DEBE** ser IndexedDB mediante Dexie, con **migraciones versionadas**.
- La integridad de las partidas guardadas **DEBE** protegerse con doble buffer de escritura y rotación de backups; una escritura interrumpida no puede corromper el save vigente.
- **NO DEBE** introducirse en v1 ningún servidor propio, base de datos remota, autenticación, cuentas de usuario ni telemetría.

*Justificación:* es un juego personal de un jugador; un backend añadiría complejidad, coste y superficie sin aportar valor. El riesgo real es perder una partida, no escalar a millones.

*Cómo se verifica:* no existen llamadas de red en el bundle salvo la carga de assets estáticos. Un save escrito, cerrado y reabierto conserva su estado; una interrupción simulada durante el guardado no deja el save vigente ilegible.

### 3. La IA rival es heurística determinista, nunca un LLM

El rival controlado por la máquina **DEBE** implementarse como un **motor de heurísticas deterministas** local. Los perfiles del manual (§28: tácticos, de gestión y de personalidad) son *políticas codificables*.

- **NO DEBE** delegarse ninguna decisión de la IA rival en un modelo de lenguaje, ni local ni remoto, ni en tiempo de partida ni de gestión.
- Las decisiones de la IA **DEBEN** ser reproducibles dada la semilla y el estado (corolario del Principio 1).

*Justificación:* un LLM rompería el determinismo, encarecería y ralentizaría el juego, y haría imposible el balance por simulación. Los perfiles ya están diseñados como reglas.

*Cómo se verifica:* dos partidos IA-vs-IA con la misma semilla y perfiles producen la misma secuencia de jugadas.

### 4. El contenido es datos, no código

Las cartas (~182 en el catálogo completo), formaciones, estilos, roles y perfiles de IA **DEBEN** vivir como **datos declarativos** en `packages/content`, validados con **Zod**.

- La lógica de efectos **DEBE** ser un sistema híbrido: datos declarativos + *handlers* registrados por identificador. No `if/else` codificando cartas concretas dispersos por el motor.
- Balancear el juego **DEBE** poder hacerse editando datos, sin reescribir la lógica del motor.
- Todo save o contenido importado desde fuera **DEBE** validarse con Zod antes de usarse.

*Justificación:* separar contenido de mecánica permite iterar el balance con seguridad, testar el catálogo y evitar que el motor crezca sin control.

*Cómo se verifica:* añadir o retocar una carta no requiere tocar `packages/core`. El catálogo pasa la validación Zod en CI.

### 5. Toda regla del juego entra con su prueba

Ninguna mecánica se da por terminada "probándola a mano en la UI".

- Cada regla nueva **DEBE** llegar acompañada de: (a) un escenario **BDD** en `features/*.feature` (Gherkin, con semilla fija) que actúe como criterio de aceptación, y (b) pruebas **unitarias** (Vitest).
- Los invariantes que deben cumplirse *para todo input* **DEBEN** cubrirse con **property-based testing** (fast-check): p. ej. "la fuerza resultante nunca sale de su rango", "resolver es determinista para una semilla", "barajar es una permutación".
- Los comportamientos observables del partido **DEBERÍAN** protegerse con **golden replays** (log de eventos de un partido sembrado, guardado como snapshot).

*Justificación:* el motor puro hace que probar sea barato; desperdiciarlo lleva a regresiones de balance invisibles.

*Cómo se verifica:* un PR que introduce una regla sin `.feature` ni test no cumple. `pnpm test` en verde es requisito de cierre.

### 6. Fidelidad al manual, verificada por el harness

El manual de diseño es la fuente de verdad de las reglas; su cumplimiento **DEBE** verificarse empíricamente.

- El **harness de simulación** (`tools/sim`) **DEBE** poder correr miles de partidos IA-vs-IA headless y comprobar estadísticas agregadas contra las metas de calibración del manual (p. ej. élite vs mediocre ≈ 80-85 %, peso del azar ≈ 33 %).
- Cualquier cambio que toque reglas del juego **DEBE** mantener esas métricas dentro de sus bandas.
- Una **divergencia deliberada** respecto al manual **DEBE** documentarse como ADR con su justificación; **NO DEBE** silenciarse ni "ajustarse a ojo".

*Justificación:* "se siente bien" no es medible; las tablas del manual sí. El harness convierte el diseño en algo falsable.

*Cómo se verifica:* `pnpm sim` reporta las tasas agregadas y falla si salen de las bandas declaradas.

### 7. Alcance vertical y anti-agotamiento

El riesgo dominante del proyecto es el **alcance**, no la técnica.

- La **v1 DEBE** ser *una temporada jugable* de extremo a extremo con un subconjunto reducido (~50-70 cartas), no el manual completo.
- El trabajo **DEBE** rebanarse en **verticales jugables** (algo que se pueda jugar y probar), no en capas horizontales inacabadas.
- **NO DEBE** construirse un sistema entero (todo el draft, toda la química, todos los nodos) antes de que exista un partido jugable que lo necesite.
- Ante la duda entre "más completo" y "jugable antes", **DEBE** elegirse jugable antes.

*Justificación:* un dev solo se agota intentando el todo de golpe; una espina dorsal jugable mantiene la motivación y valida el diseño pronto.

*Cómo se verifica:* cada feature entrega algo observable/jugable o un test que lo respalda; el backlog se ordena por "camino al partido jugable".

### 8. Separación de estado: run vs partido

El estado **DEBE** dividirse explícitamente en dos ámbitos:

- **Estado de run** (persistente entre partidos): franquicia, plantilla, química, temporada, progreso del roguelite, permadeath.
- **Estado de partido** (efímero): mano, mazos barajados, reloj, momentum, energía, fatiga de la sesión.
- La UI (Zustand) **NO DEBE** ser la dueña de la verdad de las reglas; solo refleja y despacha acciones al motor.

*Justificación:* mezclar ambos ámbitos corrompe saves, complica el permadeath y hace intestable el partido.

*Cómo se verifica:* el estado de partido puede descartarse sin afectar la integridad del estado de run persistido.

### 9. Desarrollo dirigido por especificación (SDD)

El trabajo empieza por la **especificación**, no por el código.

- Cada feature **DEBE** seguir el flujo de Spec Kit: `constitution → specify → clarify → plan → checklist → tasks → analyze → implement`.
- La spec describe el **qué** y el **porqué**; la tecnología concreta se decide en `plan`, no antes.
- Cada feature **DEBE** vivir en su propia rama de git (`NNN-nombre`), que Spec Kit usa para detectar la feature activa.
- Los nombres del dominio del manual (duelo, carril, momentum, run, permadeath, química) **DEBEN** usarse de forma consistente en specs, features y código.

*Justificación:* la especificación previa da a los agentes un objetivo claro y un idioma común, y reduce el retrabajo.

*Cómo se verifica:* existe una `spec` y un `.feature` antes del código de cada feature no trivial.

### 10. Calidad, tipos y tooling disciplinados

- El linting y el formato **DEBEN** hacerse con **Biome** (un binario). **NO DEBE** añadirse ESLint ni Prettier.
- TypeScript **DEBE** usarse en **modo estricto**; `tsc --noEmit` es la fuente de verdad de tipos.
- Antes de considerar cualquier tarea terminada, **DEBEN** estar en verde: `pnpm type`, `pnpm check` y `pnpm test` (y `pnpm sim` si se tocaron reglas).
- **NO DEBE** añadirse ninguna dependencia sin justificarla y registrarla en `DEPENDENCIAS.md`.
- **NO DEBE** introducirse un servidor ni un framework con servidor (p. ej. Next.js): no hay backend que lo justifique.

*Justificación:* un toolchain pequeño y consistente cabe en la cabeza de una persona y reduce fricción y deuda.

*Cómo se verifica:* las puertas de calidad son parte del cierre de tarea y del pre-commit.

### 11. Experiencia y accesibilidad

- La interfaz **DEBE** cumplir **WCAG 2.1 AA** como línea base (contraste, foco, navegación por teclado, no depender solo del color).
- El diseño **DEBE** sostener los tres registros emocionales del juego: el **duelo** (cinematográfico y tenso), la **gestión** (legible y sobria) y la **presión de muerte** del roguelite (permadeath siempre visible).
- La **pantalla de duelo DEBE** ser lo primero que se pula: es el corazón de la experiencia.

*Justificación:* el drama de los duelos es la promesa del juego; la accesibilidad es barata si se hace desde el principio y cara si se añade tarde.

*Cómo se verifica:* revisión de contraste/teclado en las pantallas entregadas; la pantalla de duelo tiene prioridad en el orden de pulido.

---

## Restricciones tecnológicas

Estas elecciones son vinculantes salvo enmienda (ver Gobernanza). El *porqué* detallado está en el PRD y sus ADRs.

- **Lenguaje:** TypeScript estricto.
- **UI:** React 19 + Vite. **Estado:** Zustand.
- **Estilos:** Tailwind CSS. **Animación:** Framer Motion.
- **Persistencia:** Dexie sobre IndexedDB, con migraciones versionadas.
- **Validación:** Zod. **Aleatoriedad:** PRNG sembrado *splittable*.
- **Calidad:** Biome. **Tests:** Vitest + fast-check + Gherkin (BDD).
- **Prohibido en v1:** backend, LLM para la IA rival, ESLint/Prettier, Next.js, dependencias de runtime en `packages/core` más allá de utilidades puras.

---

## Flujo de desarrollo y puertas de calidad

1. Rama nueva por feature (`git checkout -b NNN-nombre`).
2. `specify` → `clarify`: el qué y el porqué.
3. Escribir `features/NNN.feature` (BDD) como criterio de aceptación.
4. `plan` → `tasks`: el cómo, con el stack.
5. `implement` con TDD (test primero, luego código).
6. Puerta de calidad: `pnpm type` && `pnpm check` && `pnpm test` en verde.
7. Si se tocaron reglas: `pnpm sim` dentro de bandas.
8. Commit + PR.

Cada revisión que revele contexto faltante se realimenta a `AGENTS.md` (documento vivo).

---

## Gobernanza

- **Precedencia.** Esta constitución prevalece sobre `AGENTS.md`, plantillas y sugerencias de agentes. El **manual de diseño** manda en *las reglas del juego*; la constitución manda en *cómo se construye*. Ante un conflicto entre un principio y una conveniencia, gana el principio.
- **Autoridad de enmienda.** Solo el autor del proyecto puede enmendar esta constitución. Un agente **NO DEBE** reinterpretar, relajar o "adaptar" un principio para que una tarea encaje; si un principio bloquea una tarea, eso es una señal para **parar y consultar**, no para continuar.
- **Procedimiento de enmienda.** Toda enmienda actualiza la **versión** y la fecha de *última enmienda*, y se propaga a `AGENTS.md` y a las plantillas de Spec Kit que corresponda.
- **Versionado (semántico) de la constitución:**
  - **MAYOR** — se elimina o redefine un principio de forma incompatible.
  - **MENOR** — se añade un principio nuevo o se amplía material una sección.
  - **PARCHE** — aclaraciones, redacción, correcciones no semánticas.
- **Revisión de cumplimiento.** En `analyze` (antes de `implement`), la spec, el plan y las tareas se contrastan contra estos principios. Lo que los viole se corrige antes de implementar.

---

## Registro de enmiendas

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-07-06 | Ratificación inicial. Once principios, restricciones tecnológicas, flujo de calidad y gobernanza. |