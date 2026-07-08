# ADR-0001 — Recalibrar la banda dinámica de incertidumbre tras corregir `sampleTriangular`

**Estado**: Aceptado
**Fecha**: 2026-07-08
**Feature**: 001-resolvedor-duelos

## Contexto

`sampleTriangular(band, rng)` implementaba la distribución triangular como la
media de dos muestras uniformes (`rng.next()` llamado dos veces sobre el mismo
`rng`), según R-002 (research.md). Pero el `Rng` (Mulberry32) es inmutable por
diseño: `next()` no avanza el estado interno del receptor (T011, data-model.md
— "dos `next()` sobre el mismo `Rng` devuelven el mismo float"). Como
consecuencia, `a` y `b` eran siempre idénticos, y `unit = (a+a)/2 = a`
colapsaba la suma de dos uniformes en una sola muestra. La raíz no estaba
solo en el código: R-002 describía el enfoque "media de dos next()" sin
advertir la inmutabilidad del Rng, por lo que induce el bug a quien
reimplemente desde él. R-002 se reescribe (exigiendo rng.split()) además de
corregir sampleTriangular, para que research.md no siga afirmando el patrón
defectuoso.

Se verificó empíricamente con un histograma de 100.000 muestras (`band=6`): la
distribución observada era plana (~8.3% en cada valor interior), no
triangular (se esperaba un pico en 0 al ~14% decayendo linealmente hasta ~2%
en los extremos). Esta distribución degenerada tiene **mayor varianza**
(equivalente a una uniforme, stddev ≈ `band/√3`) que la triangular correcta
(stddev ≈ `band/√6`).

Las bandas dinámicas 6/7/8 del §6 fueron sugeridas por el manual, calibradas a mano 
contra Football Manager asumiendo una distribución triangular ideal. La implementación con 
bug producía una distribución degenerada (uniforme) de mayor varianza; bajo ella, 6/7/8 
casualmente parecían plausibles. Con la triangular correcta —menor varianza— esas mismas 
bandas producen 93,61% en élite/mediocre (objetivo 80-85%). Es decir: la banda sugerida 
por el manual (6/7/8) y la tasa objetivo del manual (80-85%) son incompatibles bajo la 
distribución correcta.

## Decisión

1. Corregir `sampleTriangular` para tomar las dos uniformes de dos
   generadores hijos independientes (`rng.split()` dos veces, cada uno
   consumido una vez), no de dos llamadas a `next()` sobre el mismo `rng`.
   Se verificó con el mismo histograma de 100.000 muestras que la
   distribución resultante es fiel a la forma triangular (pico en 0 ≈16%,
   decayendo simétricamente hacia los extremos).
2. Recalibrar dynamicBand() de 6/7/8 a 10/11/12, priorizando la tasa objetivo de
   CE-002 (80-85%) sobre la banda sugerida por el manual (6/7/8), dado que ambas
   son incompatibles con la triangular corregida.

## Verificación

Antes de recalibrar, se descartó que el exceso de tasa de éxito viniera de
otra parte del pipeline (carril, modificadores, potencia de carta, tabla de
compresión de atributo): se aisló el diferencial "limpio" +5
(élite +4 vs mediocre −1, sin variabilidad de carril) y se confirmó que
coincide exactamente con lo que especifica la tabla del skill `sim-harness`.
Con ese diferencial correcto y las bandas originales 6/7/8, la tasa de éxito
daba 93.61% (objetivo 80-85%) — el problema estaba exclusivamente en la
banda, no en el cálculo del diferencial.

Se probaron varios candidatos de banda contra los tres escenarios de CE-002
(diferenciales limpios +8, +5, 0), primero con N=10.000-20.000 y luego
confirmando estabilidad con N=50.000/100.000/200.000:

| Banda (0-4 / 5-6 / 7+) | élite/pésimo (90-95%) | élite/mediocre (80-85%) | bueno/bueno (45-55%) |
|---|---|---|---|
| 6/7/8 (original)  | 99.80% ❌ | 93.61% ❌ | 42.36% ❌ |
| 9/10/11           | 94.90% ✅ | 85.29% ❌ | 44.86% ❌ |
| **10/11/12**       | **92.86–93.11% ✅** | **81.90–82.60% ✅** | **44.9–45.4% ✅** (al borde inferior, estable) |
| 11/12/13          | 90.83% ✅ | 79.80% ❌ | 45.42% ✅ |

`10/11/12` es el único candidato dentro de banda en los tres escenarios de
forma consistente a través de tamaños de muestra crecientes (N=50k/100k/200k
todos caen en 45.0-45.2% para bueno/bueno, sin oscilar fuera de banda).

## Consecuencias

- `dynamicBand()` en `packages/core/src/duel/uncertainty.ts` pasa de
  `6/7/8` a `10/11/12`.
- El suelo mínimo de banda (`BAND_FLOOR = 3`, CE-004) no cambia — no forma
  parte de este ajuste.
- **`SPECIAL_TECHNIQUE_BAND = 4` tampoco cambia, pero su relación con la
  banda normal sí**: antes de este ajuste la banda de técnica especial (4)
  era ~0.5-0.67× la banda normal (6-8); tras la recalibración es ~0.33-0.4×
  (4 vs 10-12) — el caso "ambos lados traen técnica especial" quedó
  proporcionalmente mucho más determinista (menos incertidumbre relativa) de
  lo que era antes. No se ha verificado si esta certeza relativa más alta
  sigue siendo el resultado de diseño deseado, porque el catálogo de
  técnicas especiales está fuera de alcance de la feature 001 (solo existe
  el punto de extensión, sin datos reales que lo ejerciten). **Revisar este
  punto cuando se implemente el catálogo de técnicas especiales**: puede que
  `SPECIAL_TECHNIQUE_BAND` necesite su propia recalibración, o un test de
  calibración dedicado a ese camino (no solo el test unitario actual que
  verifica el valor numérico crudo).
- `specs/001-resolvedor-duelos/data-model.md`,
  `specs/001-resolvedor-duelos/contracts/resolverDuelo.md`,
  `specs/001-resolvedor-duelos/spec.md`,
  `specs/001-resolvedor-duelos/tasks.md` (T019) y
  `specs/001-resolvedor-duelos/checklists/requirements.md` (CHK011, CHK028)
  se actualizaron para reflejar los nuevos valores de banda dinámica.
- `pnpm sim` y los tests de calibración
  (`resolveDuel.calibration.test.ts`) deben re-verificarse en verde con los
  nuevos valores.
- "bueno vs bueno" queda cerca del límite inferior de su banda (45%); si
  futuros cambios de balance lo empujan por debajo de 45%, revisar este ADR
  antes de tocar `dynamicBand` de nuevo.
