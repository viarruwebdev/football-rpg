# Research — Resolvedor de duelos

**Feature**: 001-resolvedor-duelos | **Fecha**: 2026-07-08

No había incógnitas bloqueantes (el usuario fijó el patrón de Rng y la spec está completamente clarificada). Este archivo recoge las decisiones de investigación tomadas durante la planificación.

---

## R-001 — PRNG puro en TypeScript sin dependencias

**Decisión**: implementar Mulberry32 como función pura de 10 líneas en `packages/core/src/rng/`.

**Razonamiento**:
- Es el algoritmo más sencillo con buenas propiedades estadísticas para un juego (no criptográfico).
- Cero dependencias de runtime en `packages/core` (constitución §10).
- Determinista, portátil (funciona en browser y Node), y encaja en una sola función.
- `split()` se implementa derivando una nueva semilla con una operación de mezcla barata (p.ej. `semilla ^ 0x9e3779b9`).

**Alternativas descartadas**:
- `crypto.getRandomValues`: no determinista con semilla, requiere Web Crypto API.
- `xoshiro128**`: mejor calidad estadística pero más complejo; overkill para ~10 llamadas por duelo.
- Librería externa (p.ej. `seedrandom`): añadiría una dependencia de runtime al núcleo, vetada por la constitución.

---

## R-002 — Distribución triangular discreta

**Decisión**: muestreo por suma de dos uniformes en `[−banda, +banda]` dividida a la mitad, redondeada al entero más cercano. **Las dos uniformes deben provenir de dos generadores `Rng` hijos independientes (`rng.split()`), nunca de dos llamadas a `next()` sobre el mismo `rng`** — ver [ADR-0001](./adr/0001-recalibrar-banda-dinamica.md).

**Razonamiento**:
- La suma de dos uniformes produce una distribución triangular. Con dos muestras independientes escaladas a `[−banda, +banda]`, la suma dividida entre dos produce el triángulo centrado en 0 con soporte `[−banda, +banda]`.
- El `Rng` es inmutable por diseño (T011): `rng.next()` llamado dos veces sobre la misma instancia siempre devuelve el mismo valor. Por eso las dos uniformes exigen dos hijos distintos vía `split()`, no dos `next()` seguidos — la redacción original de esta decisión no lo advertía explícitamente y esa omisión llevó a una implementación con bug (ver ADR-0001).
- El redondeo al entero convierte el continuo en los valores discretos que usa la tabla.
- Sencillo de testear (fast-check verifica suelo mínimo y soporte).

**Alternativas descartadas**:
- Lookup table precalculada: inflexible ante banda dinámica y ajuste de Composure.
- Box-Muller (normal): no garantiza soporte acotado; requiere `Math.log`/`Math.sqrt`.

---

## R-003 — Rendimientos decrecientes sobre modificadores

**Decisión**: implementar como función `applyDiminishing(mods: number[]): number` que acumula los valores ordenados por |magnitud| descendente aplicando los tramos 100%/50%/33%.

**Razonamiento**:
- La spec y el §6 son explícitos: puntos 1-4 al 100%, 5-8 al 50%, 9+ al 33%.
- Los ejemplos del manual (+6→+5, +8→+6, +10→+7) son los golden tests de esta función.
- Ordenar por magnitud descendente (mayor impacto primero) es coherente con la intención de diseño.

**Nota**: el usuario confirmó que potencia de carta, influencia de atributo y efecto de carril son **íntegros** (no entran en los rendimientos decrecientes).

---

## R-004 — Estructura de módulos vs monolito

**Decisión**: módulos pequeños con responsabilidad única (ver plan.md D-002).

**Razonamiento**: el resolvedor tiene seis pasos bien diferenciados (atributo→influencia, mods, incertidumbre, diferencial, clasificación, eventos). Separar cada uno facilita los tests unitarios de regresión y la lectura futura por agentes. El coste (más archivos) es menor que el beneficio (surface de test más pequeña por módulo).
