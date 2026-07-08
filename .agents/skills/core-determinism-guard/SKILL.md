---
name: core-determinism-guard
description: >-
  Guardián de la pureza y el determinismo del motor del Football RPG. Úsala
  siempre que escribas, revises o edites código en packages/core, o antes de
  cerrar cualquier tarea que lo toque. Rechaza fuentes de no-determinismo y
  efectos secundarios (Math.random, Date.now/Date, fetch/red, window/document/DOM,
  I/O), exige que la aleatoriedad entre por un PRNG sembrado explícito, y verifica
  que el núcleo no importe de la UI. Palabras clave: determinismo, pureza,
  packages/core, PRNG, semilla, reducer, efectos secundarios, guardrail.
---

# Guardián de determinismo del núcleo

El motor (`packages/core`) es una función pura `reducir(estado, acción, rng) → { estado, eventos }` (constitución, Principio 1). Es lo que nos da tests, replays, balance por simulación y depuración por semilla. Esta skill automatiza el error más fácil de colar y más caro de arrastrar.

## Checklist obligatorio antes de cerrar cualquier cambio en `packages/core`

Ninguna ruta de `packages/core` puede contener:

- [ ] `Math.random(` — usa el PRNG sembrado que se pasa como argumento.
- [ ] `Date.now(`, `new Date(`, `performance.now(` — el tiempo entra como dato del estado, no se lee del reloj.
- [ ] `fetch(`, `XMLHttpRequest`, `WebSocket`, cualquier red.
- [ ] `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, DOM.
- [ ] lectura/escritura de disco o `process.env` que altere la lógica.
- [ ] mutación de los argumentos de entrada (el reducer devuelve estado nuevo, no muta).
- [ ] `import` desde `apps/`, `ui/` o cualquier capa de presentación.

Comando rápido de verificación:

```bash
grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" packages/core/src \
  && echo "❌ posible no-determinismo en core" || echo "✅ core limpio"
```

Y para el aislamiento de capas:

```bash
grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src \
  && echo "❌ core importa de la UI" || echo "✅ dependencias correctas"
```

## Cómo debe entrar la aleatoriedad

Un **PRNG sembrado y splittable**, pasado explícitamente por el árbol de decisiones. Nunca un generador global ni estado mutable oculto.

```ts
// bien: la semilla viaja como argumento y se divide por rama
function resolveDuel(input: DuelInput, rng: Rng): DuelResult {
  const [rngBand, rngNext] = rng.split();
  const uncertainty = sampleTriangular(rngBand, band);   // determinista dada la semilla
  // …
}

// mal:
const uncertainty = Math.floor(Math.random() * 13) - 6;  // ❌ rompe replays y balance
```

Regla: **misma entrada + misma semilla ⇒ mismos `eventos` y mismo `estado`, siempre.** Si dos ejecuciones divergen, hay una fuga de no-determinismo: búscala con el grep de arriba.

## Refuerzo automatizado (recomendado)

- **Test de determinismo (fast-check):** para cada función pública del motor, `f(x, seed) === f(x, seed)` sobre entradas arbitrarias.
- **Golden replay:** un partido sembrado produce un log de eventos; se guarda como snapshot; cualquier cambio no intencionado lo rompe.
- **Frontera de import:** una regla de Biome o un test que falle si `packages/core` importa de la UI.
- Considera fijar reglas de Biome que marquen el uso de las APIs prohibidas dentro de `packages/core`.

## Señal de alto

Si para completar una tarea "necesitas" tiempo real, azar global, red o DOM dentro del núcleo, **para**: o el dato debe entrar por el estado/acción, o el efecto pertenece a la capa `apps/game`, no al motor. No reinterpretes el Principio 1 para que la tarea encaje; es señal de replantear, no de saltárselo.

## Qué NO hacer

- No "solo por ahora" metas `Math.random`/`Date.now` en el motor.
- No leas del DOM ni de red dentro de `packages/core`.
- No dependas del orden de iteración de un `Set`/`Map` sin sembrar; ordena de forma estable.
- No muevas efectos de UI al núcleo para "simplificar".