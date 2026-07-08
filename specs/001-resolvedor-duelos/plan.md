# Plan de implementación — Resolvedor de duelos

**Branch**: `001-resolvedor-duelos` | **Fecha**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

---

## Resumen

Implementar `resolverDuelo(entrada: EntradaDeDuelo, rng: Rng): ResultadoDeDuelo` en `packages/core/src/duel/` como función pura y determinista según el §6 del manual. La función calcula fuerzas, muestrea la incertidumbre con distribución triangular, clasifica el resultado en uno de los siete tramos y emite eventos tipados — sin tocar estado global, DOM, red ni aleatoriedad implícita.

---

## Contexto técnico

**Lenguaje/Versión**: TypeScript estricto (v6, `"moduleResolution": "bundler"`)

**Dependencias principales**:
- `packages/core` — lógica pura; sin dependencias de runtime externas
- `packages/content` — tipos de carta y atributo (dobles de prueba en v1 si el catálogo no existe aún)
- Vitest + fast-check — tests unitarios y property-based
- `@amiceli/vitest-cucumber` — BDD/Gherkin

**Almacenamiento**: N/A — función pura sin estado persistente

**Testing**: Vitest (unit), fast-check (property-based), Gherkin/vitest-cucumber (BDD)

**Plataforma objetivo**: navegador + Node (Vitest/harness); solo ES2022 sin DOM

**Tipo de proyecto**: librería interna (`packages/core`)

**Objetivos de rendimiento**: sin target numérico de latencia (función pura, microsegundos)

**Restricciones**:
- Cero `Math.random`, `Date.now`, `Date`, `fetch`, `window`, `document` en `packages/core`
- Rng inmutable y splittable: `{ next(): number; split(): Rng }`
- La semilla (`number`) entra solo en el punto externo (`makeRng(semilla)`); `resolverDuelo` recibe `Rng`, no la semilla

**Escala/Alcance**: un solo duelo de eslabón normal; feature 002 añadirá el remate vs portero

---

## Constitution Check

| Principio | Estado | Nota |
|-----------|--------|------|
| P1 — Núcleo puro y determinista | ✅ PASS | `resolverDuelo` es función pura; Rng inmutable por argumento; `rng.split()` para sub-cálculos |
| P2 — Local-first sin backend | ✅ N/A | Feature de lógica pura |
| P3 — IA heurística determinista | ✅ N/A | No toca la IA en esta feature |
| P4 — Contenido como datos | ✅ PASS | Cartas y atributos como tipos en `packages/content`; lógica en `packages/core` |
| P5 — Toda regla llega con su test | ✅ PASS | BDD `.feature` + Vitest unit + fast-check property-based requeridos |
| P6 — Fidelidad al manual §6 | ✅ PASS | CE-002..005 verificables con harness; divergencias → ADR |
| P7 — Vertical jugable | ✅ PASS | Pieza atómica de la espina dorsal; sin ella no hay partido |
| P8 — Separación estado run/partido | ✅ PASS | Resolvedor stateless; no mezcla ámbitos |
| P9 — SDD | ✅ PASS | Spec → clarify → plan en orden |
| P10 — Tooling disciplinado | ✅ PASS | TS estricto, Biome, Vitest |
| P11 — Accesibilidad | ✅ N/A | Lógica pura, sin UI |

---

## Estructura de archivos

### Documentación (esta feature)

```text
specs/001-resolvedor-duelos/
├── plan.md          ← este archivo
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
├── quickstart.md    ← Phase 1
├── contracts/
│   └── resolverDuelo.ts.md   ← Phase 1
└── tasks.md         ← /speckit-tasks (no generado aquí)
```

### Código fuente

```text
packages/core/src/
├── rng/
│   ├── types.ts          # interfaz Rng + makeRng(semilla)
│   └── index.ts
├── duel/
│   ├── types.ts          # EntradaDeDuelo, ResultadoDeDuelo, Evento, Tramo
│   ├── attributeToInfluence.ts   # tabla de compresión 1-20 → −4..+4
│   ├── modifiers.ts      # rendimientos decrecientes sobre bruto acumulado
│   ├── uncertainty.ts    # distribución triangular + banda dinámica + Composure
│   ├── classify.ts       # Resultado → Tramo (siete tramos)
│   ├── events.ts         # Tramo → Evento[]
│   ├── resolverDuelo.ts  # función principal, orquesta el pipeline
│   └── index.ts          # re-exporta solo la API pública
└── index.ts              # re-exporta pública de packages/core

features/
└── 001-resolvedor-duelos.feature   # criterios de aceptación BDD

packages/core/src/duel/__tests__/
├── attributeToInfluence.test.ts
├── modifiers.test.ts
├── uncertainty.test.ts
├── classify.test.ts
├── events.test.ts
├── resolverDuelo.test.ts           # determinismo, calibración, casos límite
└── resolverDuelo.property.test.ts  # fast-check: suelo de banda, cobertura, determinismo
```

---

## Pipeline de resolución

```
EntradaDeDuelo + Rng
       │
       ▼
[1] calcularFuerzaAtaque
    = potenciaCarta + atributoToInfluencia(atributo) + decrecimiento(mods)

[2] calcularFuerzaDefensa
    = potenciaCarta + atributoToInfluencia(atributo) + decrecimiento(mods)
      + efectoCarril(aciertoCarril)          ← íntegro, no entra en mods

[3] diferencial = fuerzaAtaque − fuerzaDefensa

[4] banda = computeBand(diferencial, composureAtacante, tecnicaEspecialAmbos)
    // computeBand (puro, sin rng): bandaDinámica(|diferencial|) + ajusteComposure,
    //                              con max(_, 3); o 4 fija si tecnicaEspecialAmbos
    incertidumbre = sampleTriangular(banda, rng.split())   ← rng hijo independiente

[5] resultado = diferencial + incertidumbre

[6] tramo = clasificar(resultado)            ← siete tramos, sin huecos

[7] eventos = emitirEventos(tramo)           ← discriminated union v1
    Tabla §6 (eslabón normal):
    exitoAplastante  → avance(ataque) + roboCarta(ataque) + momentum(ataque,+1)
    exitoLimpio      → avance(ataque)
    avanceForzado    → avance(ataque) + presion(+1)
    balonDividido    → miniDuelo
    perdidaSimple    → transicion
    perdidaConDesventaja → transicion + momentum(defensa,+1)
    contragolpeDevastador → transicion + roboCarta(defensa) + momentum(defensa,+2)
       │
       ▼
ResultadoDeDuelo { tramo, resultado, eventos }
```

---

## Decisiones de diseño

### D-001 — Rng como interfaz inmutable y splittable

La semilla entra como `number` solo en el punto de entrada externo. `makeRng(semilla): Rng` construye el generador (implementación concreta a elegir — Mulberry32, xoshiro128 o similar, pura JS, sin deps). `resolverDuelo(entrada, rng)` recibe el `Rng`; sub-cálculos con azar independiente (incertidumbre, futuros mini-duelos) usan `rng.split()`, que devuelve un hijo sin mutar el padre. Esto garantiza que el mismo `Rng` en el mismo estado produce siempre el mismo resultado.

### D-002 — Módulos pequeños con responsabilidad única

Cada paso del pipeline vive en su propio archivo. Facilita el test unitario de cada transformación de forma aislada y evita una función de 200 líneas imposible de leer.

### D-003 — Tipos en `packages/core`, datos en `packages/content`

`EntradaDeDuelo` referencia tipos de carta y atributo definidos en `packages/content` (o sus equivalentes de prueba). El resolvedor no importa cartas concretas; solo opera sobre los valores numéricos que recibe.

### D-004 — Punto de extensión para técnica especial como campo opcional

`EntradaDeDuelo` incluye `tecnicaEspecial?: TecnicaEspecialId` por lado. En v1, si ambos lados lo traen, `resolverDuelo` desvía a banda fija ±4. Los efectos específicos de cada técnica llegan en features posteriores sin breaking change.

### D-005 — Eventos como discriminated union

`Evento` es un discriminated union tipado (no `Record<string, unknown>`). Los consumidores hacen `switch (evento.tipo)` con exhaustividad de TypeScript. Variantes v1: `avance`, `roboCarta`, `momentum`, `transicion`, `miniDuelo`.

---

## Complejidad y riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Implementación incorrecta de la distribución triangular | Media | Property-based test CE-004 (suelo ±3) + golden replay |
| Derivación del cálculo de rendimientos decrecientes | Media | Test unitario exhaustivo de `modifiers.ts` con los ejemplos del §6 |
| `rng.split()` no produce secuencias realmente independientes | Baja | Test de correlación: dos splits con la misma raíz producen valores distintos |
| Huecos o solapamientos en la clasificación de tramos | Baja | Property-based CE-005: todo entero en −∞..+∞ cae en exactamente un tramo |
