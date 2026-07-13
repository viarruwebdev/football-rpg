# AGENTS.md

> Fuente de verdad para **cualquier** agente de código (Claude Code, OpenCode, Antigravity, Codex, Cursor…).
> `CLAUDE.md` la importa con `@AGENTS.md`. No dupliques reglas: edítalas aquí.
> Estándar AGENTS.md (AAIF / Linux Foundation), leído nativamente por 30+ herramientas.

---

## 1. Qué es este proyecto

**Football RPG** es un roguelite de fútbol por cartas contra IA, de un solo jugador, que corre **íntegramente en el navegador**. Gestionas una franquicia (estilo NBA), el partido se decide en **duelos de cartas** (drama estilo Captain Tsubasa) y la liga es una **run con permadeath**.

Es un proyecto **personal**, desarrollado por **1 persona + agentes de IA**. No hay equipo, ni SLA de producción, ni usuarios externos. Optimizamos para: que un agente pueda avanzar sin romper invariantes, y que el autor no se agote por exceso de alcance.

## 2. Reglas de oro (NO negociables. LEER antes de cualquier tarea)

Estas decisiones definen la arquitectura. Cualquier cambio que las viole debe rechazarse o escalarse al autor, no implementarse.

1. **El núcleo del juego es una función pura y determinista.**
   `reducir(estado, acción, rng) → { estado, eventos }`. Sin `Date.now()`, sin `Math.random()`, sin `fetch`, sin acceso a `window`/DOM, sin I/O dentro de `packages/core`. Mismos inputs ⇒ mismos outputs, siempre. Esto es lo que nos da tests, replays, depuración por semilla y balance por simulación.
2. **No hay backend en v1.** Es una SPA local-first. Toda la persistencia es cliente (IndexedDB vía Dexie). Nada de servidores, cuentas, ni APIs propias.
3. **La IA rival NO es un LLM.** Es un **motor heurístico determinista** local. Los perfiles del manual (§28: tácticos, gestión, personalidad) son *políticas codificables*, no prompts. Un LLM rompería el determinismo, sería caro y lento.
4. **El contenido es datos, no código.** Las ~182 cartas, formaciones, estilos, roles y perfiles de IA viven como datos validados con Zod, no como `if/else`. La lógica de efectos es un sistema híbrido (datos declarativos + handlers registrados).

> Si te descubres "reinterpretando" una de estas reglas para que una tarea encaje, esa reinterpretación es la señal para PARAR y preguntar, no para continuar.

## 3. Arquitectura

Tres capas, dependencias solo hacia dentro:

```
contenido (datos + Zod)  ─►  core (motor puro)  ◄─  app (estado/persistencia)  ◄─  ui (React)
```

- **`packages/core`** — motor puro. Resolución de duelos (§6), reloj de partido, momentum/energía/fatiga, IA heurística, generación procedural (§36), draft (§28 lottery). Cero dependencias de UI o de navegador.
- **`packages/content`** — catálogo de cartas, formaciones, estilos, roles, perfiles de IA. Esquemas Zod + los datos. Es lo único que se toca para "balancear".
- **`apps/game`** — la app: estado de UI (Zustand), persistencia (Dexie/IndexedDB con migraciones versionadas), orquestación, y la UI en React.

El estado se separa en **estado de run** (persistente entre partidos: franquicia, plantilla, química, temporada) y **estado de partido** (efímero: mano, mazos barajados, reloj, momentum).

## 4. Stack técnico

- **Lenguaje:** TypeScript en modo estricto. `tsc --noEmit` es la fuente de verdad de tipos.
- **UI:** React 19 + Vite.
- **Estado:** Zustand.
- **Estilos:** Tailwind CSS. Animación: Framer Motion (crítico para el drama de los duelos).
- **Persistencia:** Dexie sobre IndexedDB. Migraciones versionadas + doble buffer de guardado + rotación de backups.
- **Validación:** Zod (contenido y saves importados).
- **Lint + formato:** **Biome** (un solo binario; reemplaza ESLint + Prettier). NO añadir ESLint ni Prettier.
- **Tests:** Vitest (unit/integración) + fast-check (property-based) + Gherkin para BDD. Ver §7.
- **PRNG:** generador sembrado *splittable* (semilla explícita que se pasa por el árbol de decisiones). Nunca el `Math.random` global.

Ver `DEPENDENCIAS.md` para la lista exacta y los comandos de instalación.

## 5. Estructura del repositorio

```
.
├── AGENTS.md                 # este archivo (fuente de verdad)
├── CLAUDE.md                 # importa @AGENTS.md + notas de Claude Code
├── DEPENDENCIAS.md           # librerías + Biome
├── CONFIG-0.md               # guía de arranque (Config 0)
├── biome.json                # config de Biome
├── .specify/                 # generado por Spec Kit
│   └── memory/constitution.md
├── specs/                    # specs por feature (SDD): 001-…, 002-…
├── packages/
│   ├── core/                 # motor puro determinista
│   └── content/              # cartas y datos + Zod
├── apps/
│   └── game/                 # SPA React (Vite)
├── features/                 # .feature (Gherkin, BDD)
└── tools/
    └── sim/                  # harness de simulación (balance)
```

## 6. Comandos

```bash
pnpm install            # instalar (o npm install)
pnpm dev                # servidor Vite
pnpm type               # tsc --noEmit  (fuente de verdad de tipos)
pnpm check              # biome check --write .  (lint + format + imports)
pnpm lint               # biome lint .
pnpm test               # vitest run
pnpm test:watch         # vitest
pnpm sim                # harness de balance (N partidos IA-vs-IA)
```

**Antes de dar una tarea por terminada**, un agente debe dejar en verde: `pnpm type`, `pnpm check`, `pnpm test`. Si el cambio toca reglas del juego, además `pnpm sim` no debe romper las bandas de calibración.

**Al escribir código nuevo**, cumple las reglas de Biome (`biome.json`) desde el primer borrador — no dependas de `pnpm check --write` para limpiar warnings después. Evita en especial `noNonNullAssertion` (`!`): en `Record<K, V>` donde el dominio de `K` garantiza la clave, extrae la sub-colección a una variable local o usa un helper tipado en vez de indexar con `!` repetidamente. Un warning nuevo que "ya se arreglará en el check final" tiende a acumularse y a mezclarse con los preexistentes, hasta que nadie distingue cuáles son de esta tarea.

## 7. Estrategia de pruebas (TDD + BDD + property + harness)

El motor puro hace esto barato. El orden de preferencia:

1. **BDD (Gherkin) para el comportamiento observable del juego.** Un duelo se describe como *Dado / Cuando / Entonces* con semilla fija. Estos `.feature` **son** los criterios de aceptación de las specs de Spec Kit — el puente SDD↔BDD.
2. **TDD unitario (Vitest)** para cada pieza del motor: tabla de resolución, umbrales, mods con rendimientos decrecientes, reloj, momentum.
3. **Property-based (fast-check)** para invariantes que deben cumplirse *para todo* input: p. ej. "la fuerza resultante nunca sale de su rango", "resolver es determinista para una semilla", "barajar es una permutación". Aquí es donde el determinismo paga.
4. **Golden replays**: un partido sembrado produce un log de eventos; se guarda como snapshot y protege contra regresiones de balance no intencionadas.
5. **Harness de simulación (`tools/sim`)**: corre miles de partidos IA-vs-IA headless y comprueba estadísticas agregadas contra las metas del manual (élite vs mediocre ~80-85%, ~33% azar). Valida *diseño de juego*, no solo código.

Regla: **toda regla del juego nueva entra con su test.** No se "prueba a mano en la UI".

## 8. Cómo trabajar (metodología SDD)

Este repo usa **GitHub Spec Kit**. El flujo por feature es:

```
/speckit.constitution → /speckit.specify → /speckit.clarify → /speckit.plan
   → /speckit.checklist → /speckit.tasks → /speckit.analyze → /speckit.implement
```

1. Empieza siempre por la **spec** (el *qué* y el *porqué*), no por el código.
2. La spec se traduce en `.feature` (BDD) antes de implementar.
3. La spec existe antes que el código
	Antes de implementar cualquier feature, debe existir su spec en `specs/<XXXX>-<nombre>/spec.md` con:
	- Requisitos en formato EARS
	- Escenarios BDD (Given/When/Then)
	- Tests de tabla con datos del manual
	Si no existe spec → **detente y pide al humano que la cree con `/speckit.specify`**.
4. Respeta `.specify/memory/constitution.md`: es la ley del proyecto y refleja las reglas de oro de §2.
5. Cada feature/spec se desarrolla en una rama dedicada. Nunca implementes una spec en la rama de otra. Convención de nombre de rama: `feature/spec-XXXX-<nombre-kebab>`
6. Spec Kit detecta la feature activa por la **rama de git** (`001-nombre`). Cambiar de feature = cambiar de rama.

## 9. Convenciones para desarrollo asistido por IA

- **Consulta docs con Context7** antes de usar una API de librería (React 19, Zustand, Dexie, fast-check…): añade `use context7`. No inventes APIs de memoria.
- **Módulos pequeños y con una responsabilidad.** Un agente razona mejor sobre 80 líneas puras que sobre 800 con efectos.
- **Nombres del dominio** tal cual el manual (duelo, carril, momentum, run, permadeath, química) para que specs, features y código hablen el mismo idioma.
- **Nada de dependencias nuevas** sin justificarlo y anotarlo en `DEPENDENCIAS.md`.
- **No memoices "por si acaso"** (useMemo/useCallback/memo). Escribe componentes puros y mide.
- **Cumplir Principios SOLID y buenas prácticas**

## 10. Qué NO hacer

- No introducir aleatoriedad, tiempo, red o DOM en `packages/core`.
- No convertir la IA rival en llamadas a un LLM.
- No añadir backend, base de datos remota, autenticación o telemetría.
- No meter ESLint/Prettier (usamos Biome) ni Next.js (no hay servidor que justifique).
- No implementar el juego entero de una vez: v1 = **una temporada jugable** con ~50-70 cartas. El resto es incremental.
- No generar este archivo con un LLM: se mantiene a mano (los archivos de contexto auto-generados envejecen mal).
- No escribir código escrito en español. Todo el código va en inglés.
- Cuando se derogue una regla del manual, buscar y eliminar sus copias en skills, specs, data-model y código — no solo en la fuente. Un dato derogado sobrevive en cada copia hasta que alguien la audita.
- Un golden replay generado sobre código con un bug convierte el bug en el contrato. Antes de congelar snapshots, verifica que el comportamiento capturado es el que la spec exige — no solo que es reproducible. Al corregir un bug con goldens existentes: arregla primero, regenera después, y lee el diff del snapshot.
- Un golden replay solo protege lo que incluye en su snapshot. El estado que muta en silencio (sin emitir eventos) es invisible a un golden que solo pinea eventos y resultado. Antes de confiar en un golden, verifica rompiendo el código que detecta la regresión que dices que cubre — un diff vacío puede significar "sin cambios" o "ciego al cambio".
- Un test que nunca ha fallado contra el bug que dice cubrir no cubre nada. Al arreglar un bug, verifica que el test de regresión se pone rojo contra el código previo antes de darlo por bueno.
- Una tabla de cobertura RF→tarea→test verifica que existe un test, no que prueba lo que dice. Un test puede estar mapeado al requisito correcto, tener el nombre correcto, pasar en verde, y no tocar el código que cubre. La única verificación real es romper el código a propósito y ver si el test falla.
- `toBeDefined()` sobre expresiones que devuelven booleanos o arrays es tautológico y no puede fallar. Lo mismo una aserción encerrada en un `if` que puede no ejecutarse. Barre ambos patrones al revisar tests.
- Un punto de extensión declarado en el tipo pero no consumido es una promesa incumplida. Documentarlo no basta: escribe un test de no-implementación que afirme el comportamiento actual. Cuando alguien lo cablee, el test romperá visiblemente y le obligará a actualizarlo a propósito, no en silencio.
- `/analyze` verifica que existe un test por requisito, no que ese test toque el camino real. Un test puede llamar a una función pura que el orquestador nunca invoca. La única verificación es romper el código y ver si falla. Y si un test no cubre lo que su nombre dice, renómbralo — un test que miente sobre su cobertura es peor que no tenerlo.
- Valida en la frontera y falla ruidosamente. Un filtro defensivo en el receptor convierte un contrato roto en comportamiento correcto y entierra el bug del llamador. Prefiere una aserción que grite a un filtro que calle. Aplica al motor entero, no solo al momentum.
- En una feature de integración (la que conecta módulos existentes a un orquestador), escribe el test de punta a punta ANTES que los unitarios. Si primero verificas las piezas en aislamiento, pueden quedar correctas y sin cablear —y los verdes te dirán "hecho" sobre un orquestador que reimplementa o ignora las piezas. El test de integración primero hace imposible ese fallo.
- Un placeholder para lógica de decisión diferida a otra feature debe ser neutral, no inteligente. Una política placeholder que introduce una estrategia concreta (siempre reconvertir, primera carta disponible) sesga toda métrica de balance medida sobre ella. Elige el comportamiento más obvio y sin táctica, y deja la decisión real como punto de extensión.
- Un test que verifica una magnitud agregada (tamaño, conteo, total) es ciego al estado que muta por debajo de esa magnitud. Un set del tamaño correcto puede tener marcas de uso sin limpiar; una mano del tamaño correcto puede contener las cartas equivocadas. Para estado que se regenera o resetea, prueba el comportamiento observable tras el reset, no la forma del contenedor.

## 11. Referencias

- `DEPENDENCIES.md` — librerías y Biome.
- `Football-RPG-PRD-Arquitectura.md` — PRD completo, ADRs y justificaciones.
- Manual de diseño (/doc/Football RPG) — fuente de verdad de las reglas del juego.