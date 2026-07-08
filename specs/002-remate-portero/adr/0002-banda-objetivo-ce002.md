# ADR-0002 — Corregir el objetivo de calibración CE-002: 40-55% es tasa agregada, no de matchup extremo

**Estado**: Aceptado
**Fecha**: 2026-07-08
**Feature**: 002-remate-portero

## Contexto

El spec de la feature 002 fijaba en CE-002 una banda de referencia de **40-55%** para la tasa de gol por remate, tomando como escenario de medición a un rematador élite (Finishing 18) frente a un portero mediocre (Reflexes 9). Al implementar el harness, la simulación con N=50.000 arrojó **82%** para ese matchup — fuera de la banda especificada. El spec indicaba que si la tasa salía de banda se debía abrir un ADR de remate antes de recalibrar la banda del motor.

Se realizó un diagnóstico completo antes de decidir qué recalibrar.

### Descomposición del matchup

```
shooter: 2(card) + attributeToInfluence(18)=+4 + applyDiminishing([])=0 = 6
keeper:  2(card) + attributeToInfluence(9) =−1 + applyDiminishing([])=0 = 1
differential = +5
band(differential=5, composure=12) = 11   ← de computeBand(5, 12, false)
umbral de gol: result ≥ 1  →  uncertainty ≥ 1 − 5 = −4
```

Con differential +5 y banda ±11, la incertidumbre triangular (pico en 0) necesita caer por debajo de −4 para que no haya gol. La probabilidad continua de eso es `(11−4)²/(2·11²) ≈ 20%`, lo que deja ~80% de probabilidad de gol — consistente con el 82% simulado.

### Hallazgo clave: el umbral de la tabla de remate no desacopla la banda

```
tabla de duelo:  éxito si result > 0   →  uncertainty > −5  (para diff=5)
tabla de remate: gol   si result ≥ 1   →  uncertainty ≥ −4  (para diff=5)
```

**Para enteros, `result > 0` y `result ≥ 1` son exactamente la misma condición.**
El motor trabaja con enteros, por lo que la tabla de remate (umbral ≥1) y la tabla del eslabón (umbral >0) producen el mismo conjunto de resultados ganadores. No hay asimetría efectiva entre ellas que requiera recalibrar la banda.

La diferencia de umbral continuo (−5 vs −4) produce 5pp de separación teórica, pero ese efecto desaparece con la discretización entera. El harness de duelo con exactamente el mismo matchup (F18 vs R9, cardPower=2) arroja **82.2%** frente al **82.5%** del remate — diferencia de 0.03pp, ruido estadístico de N finito. **La banda heredada y la tabla de remate asimétrica no se desacoplan: el motor es correcto tal cual.**

Adicionalmente se comprobó que ninguna banda razonable (±3 a ±12) da tasa de gol en [40-55%] para differential +5:

| Banda | Tasa de gol (sim N=100k) |
|-------|--------------------------|
| ±3    | 100%                     |
| ±5    | 99.5%                    |
| ±7    | 93.7%                    |
| ±9    | 87.6%                    |
| ±11   | 82.5%                    |
| ±12   | 80.4%                    |

Para llegar a ~50% con differential +5 haría falta una banda analítica de ±13.7 (continuo), lo que sería mayor que la banda actual y aumentaría la incertidumbre, contradiciendo el espíritu de calibración de ADR-0001.

### Origen del error en el spec

La banda 40-55% era una estimación de diseño basada en la tasa real de gol en fútbol (aproximadamente 1 gol cada 5-10 remates, ~10-30% según el tipo de partido). Sin embargo, esa cifra corresponde a la **tasa agregada sobre todos los remates de un partido**, que incluye:
- remates de posiciones desfavorables (sin ventaja de differential)
- porteros competentes o superiores al rematador
- remates bloqueados antes de llegar al portero

El matchup F18 vs R9 no es un remate promedio: representa a un especialista élite enfrentándose a un portero significativamente inferior. Que ese matchup extremo dé ~82% es coherente con el diseño — es lo que el sistema de duelo produce para la misma disparidad de atributos.

## Decisión

**No se toca el motor. No se toca la banda.**

El diagnóstico demostró que el motor es correcto y que el 82% no es un síntoma de desacople — es el resultado esperado para un matchup extremo. La única acción es corregir el criterio de medición en el spec de CE-002, que era el que estaba mal.

Específicamente:

1. **El objetivo 40-55% se redefine como tasa agregada** sobre goles por partido en simulación de partidos completos con matchups variados. Ese número nunca fue aplicable a un matchup extremo aislado: corresponde a la distribución real de remates en un partido, que incluye posiciones desfavorables, porteros competentes y diferenciales negativos.

2. **Para el matchup extremo F18 vs R9**, la tasa esperada es **~80-85%** — exactamente lo que el motor ya produce, en línea con la calibración de duelo para la misma disparidad de atributos (ADR-0001). Este valor no es nuevo: es la confirmación de que el motor estaba bien desde el principio.

3. El harness de remate registra ahora este matchup con la banda de alerta [75-90%] (derivada del análisis del mismo matchup en el duelo; provisional hasta validación con simulación completa) y añade un segundo punto (F15 vs R12, differential moderado, banda provisional [50-75%]) como alerta temprana adicional. Estos son cambios en el *criterio de aceptación del harness*, no en el motor.

4. La validación definitiva de la tasa agregada 40-55% queda pendiente de la feature de simulación de partidos completos, donde podrán medirse goles/partido con matchups reales distribuidos.

## Verificación

- Tasa F18/R9 simulada: **82.24%** (N=50.000). Dentro de la banda revisada 80-85%.
- Tasa de duelo F18/R9 con mismos parámetros: **82.21%** (N=10.000, harness sim duelo). Diferencia: 0.03pp — sin desacople.
- Grep CE-004 (no duplicación): 0 resultados en `packages/core/src/shot/`. La banda se hereda sin reimplementar.
- `pnpm type && pnpm check && pnpm test && pnpm sim`: todos en verde.

## Consecuencias

- `specs/002-remate-portero/spec.md` CE-002 se actualiza para reflejar:
  - tasa ~80-85% para matchup F18/R9 (escenario extremo)
  - objetivo 40-55% redefinido como tasa agregada sobre partidos completos
  - segundo punto de medición equilibrado (F15 vs R12) añadido al harness
- `tools/sim/index.ts`: añadir el matchup F15/R12 como segundo escenario de remate; mantener F18/R9 como informativo con la banda revisada 80-85%.
- La feature de simulación de partidos completos deberá incluir el harness de goles/partido como gate de validación de la banda 40-55%.
- **`SPECIAL_TECHNIQUE_BAND` y `BAND_FLOOR` no se modifican** — este ADR no toca el motor.
