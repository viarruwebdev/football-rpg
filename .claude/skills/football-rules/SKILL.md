---
name: football-rules
description:
  Fuente de verdad de la resolución de duelos del Football RPG (manual §6):
  fórmula de fuerza, compresión de atributos 1-20 → -4..+4, modificadores con
  rendimientos decrecientes, incertidumbre triangular con banda dinámica y
  Composure, acierto/fallo de carril, secuencia del duelo y umbrales de
  resultado (eslabón normal y remate). Úsala SIEMPRE que implementes, pruebes o
  balancees cualquier cálculo de fuerza, diferencial, resultado, umbral,
  momentum o remate en packages/core (resolveDuel, resolveShot, applyMomentum).
  Palabras clave: duelo, resolución, fuerza, diferencial, umbral, carril,
  incertidumbre, banda, Composure, momentum, remate.
---

# Reglas de resolución — Football RPG (§6)

Esta skill codifica la tabla de resolución del manual. Es la **fuente de verdad** para el motor de duelos. Si un número aquí contradice tu memoria, gana esta skill; si contradice el manual de Notion, gana el manual (y actualiza esta skill). Todos los cálculos viven en `packages/core` y deben ser **puros y deterministas** (ver skill `core-determinism-guard`).

## Fórmula base

```
FuerzaAtaque  = potenciaCarta + influenciaAtributo + modsSituacionales
FuerzaDefensa = potenciaCarta + influenciaAtributo + modsSituacionales + carril
Diferencial   = FuerzaAtaque − FuerzaDefensa
Resultado     = Diferencial + incertidumbre
```

Se aplican **íntegros, sin tope**: `potenciaCarta`, `influenciaAtributo`, `carril`. Solo `modsSituacionales` sufren rendimientos decrecientes.

## Compresión de atributos (1-20 → -4..+4)

Los atributos NUNCA se suman en bruto. Se convierten:

| Atributo | Influencia |
|---|---|
| 1-3 | -4 |
| 4-5 | -3 |
| 6-7 | -2 |
| 8-9 | -1 |
| 10-11 | 0 (jugador medio) |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-20 | +4 |

## Modificadores situacionales (rendimientos decrecientes)

Sin tope duro, pero con retorno decreciente sobre el **bruto acumulado**:

- Puntos 1-4 → 100% (1:1)
- Puntos 5-8 → 50% (2:1)
- Puntos 9+ → 33% (3:1)

Ejemplos: +3→+3, +4→+4, +6→+5, +8→+6, +10→+7, +12→+7.

**Son mods** (sufren el decrecimiento): momentum, Technique, First Touch, Important Matches, bonus de estilo, bonus de rol, bonus de química, condiciones de partido, presión acumulada por eslabón. **NO son mods** (íntegros): potencia de carta, influencia de atributo, acierto/fallo de carril.

Cap global relacionado (nota de balance del catálogo): ningún bonus externo acumulado supera +5; el exceso se ignora. La presión defensiva acumulada sube +1 por eslabón consecutivo.

## Carril (mind-game)

El defensor apuesta carril (izquierda/centro/derecha):

- Acertó → **+2** al defensor.
- Falló → **-1** al defensor.
- Swing total: 3. NO entra en el tope de mods (íntegro).

Marking modifica la apuesta: 14+ revela 1 carril que NO es el destino; 17+ revela el correcto.

## Incertidumbre (distribución triangular)

Banda base **-6..+6**, triangular centrada en 0 (extremos raros: 0≈12%, ±1≈11%, ±2≈9%, ±3≈7%, ±4≈5%, ±5≈3%, ±6≈1% por lado).

**Banda dinámica** según diferencia efectiva (antes del azar):
- 0-4 → ±6
- 5-6 → ±7
- 7+ → ±8

**Composure ajusta la banda:**
- 8-14 → sin ajuste
- 15-17 → banda −1
- 18-20 → banda −2
- <8 → banda +1

**Suelo mínimo de banda: ±3** (nunca menos, por ninguna combinación).
**Técnica especial vs técnica especial: banda fija ±4.**

> El PRNG sembrado debe muestrear la triangular; misma semilla ⇒ mismo valor. Es donde el determinismo se juega.

## Secuencia exacta del duelo

1. Atacante elige carta + jugador + destino (incluye carril). Firme.
2. Instantes pre-revelado (Amague = info falsa al defensor; Visión periférica = revela apuesta del defensor).
3. Defensor elige carta + defensor + apuesta de carril. Firme.
4. Revelado simultáneo.
5. Efectos post-revelado que manipulan carril (Recorte, Ruleta, Regate doble, Enganche y salida): no cambian el carril declarado, cambian cómo se compara.
6. Resolución: fórmula + incertidumbre + umbrales.

Apuesta de palo (portero elige carril): **solo en penaltis**, no en remates normales.

## Umbrales — eslabón normal

| Resultado | Rango | Atacante | Defensor | Momentum |
|---|---|---|---|---|
| Éxito aplastante | ≥ +6 | Avanza + roba 1 | Superado (no defiende sig.) | +1 atacante |
| Éxito limpio | +3..+5 | Avanza | — | — |
| Avance forzado | +1..+2 | Avanza +presión +1 | Reposiciona | — |
| Balón dividido | 0 | Mini-duelo | Mini-duelo | — |
| Pérdida simple | -1..-2 | Pierde balón | Inicia posesión | — |
| Pérdida con desventaja | -3..-5 | Pierde balón | Transición +2 | +1 defensor |
| Contragolpe devastador | ≤ -6 | Pierde + descolocado | Salto de zona +3 | +2 defensor |

## Umbrales — remate (tiro vs portero)

| Resultado | Rango | Efecto |
|---|---|---|
| Gol imparable | ≥ +5 | Gol, +2 momentum |
| Gol | +3..+4 | Gol, +2 momentum |
| Gol con rebote | +1..+2 | Gol, +2 momentum |
| Paradón | 0 | No gol, córner, +1 momentum defensor |
| Parada sólida | -1..-2 | No gol, portero atrapa, inversión de roles |
| Parada y contragolpe | ≤ -3 | No gol, rival desde tercio medio +2 |

Mods de remate: asistencia previa +3; centro previo → cabezazos +2; avance forzado previo -2; disparo lejano desde Ataque -3 (Long Shots 16+ −2, 18+ elimina) / desde Medio -5; ángulo lateral del Área -2.

## Balón dividido (resultado 0)

Ambos deciden a la vez **forzar** (gasta 1 energía, +2 fuerza) o **ceder**. Ambos fuerzan → nuevo aleatorio banda -2/+2, ganador +1 momentum. Atacante fuerza/def cede → atacante avanza lateral. Def fuerza/atac cede → defensor roba, misma zona. Ambos ceden → balón fuera, 1 jugada consumida.

## Momentum (resumen operativo)

Barra -5..+5, empieza en 0. Efecto lineal: +0.5 fuerza por punto, **techo en +2** (a partir de momentum +4). Solo lo mueven eventos significativos (gol ±2, aplastante ±1, técnica especial +1, racha 3+ duelos +1, robo por pressing +1, gol contra la marea +3). Degradación asimétrica: el positivo baja 1 hacia 0 por posesión sin evento; el negativo baja 1 cada posesión (más rápido); Determination alta lo acelera.

## Pesos objetivo (para el harness de balance)

Azar ≈ **33%**, decisión del jugador (cartas + carril) ≈ **31%**, preparación (atributos + mods) ≈ **37%**. Calibración de referencia (FM): élite vs mediocre ≈ **80-85%**; élite vs pésimo ≈ 90-95%; bueno vs bueno ≈ 50%.

## Invariantes verificables (property-based)

Escribe estas propiedades con fast-check en `packages/core`:

1. **Determinismo:** `resolveDuel(input, seed)` da el mismo resultado para la misma semilla.
2. **Rango de influencia:** la influencia de atributo siempre ∈ [-4, +4].
3. **Suelo de banda:** la banda de incertidumbre nunca es menor que ±3.
4. **Monotonía de mods:** aumentar un mod bruto nunca reduce el mod efectivo.
5. **Techo de momentum:** el efecto de momentum en fuerza nunca supera ±2.
6. **Cobertura de umbrales:** todo `Resultado` cae en exactamente un umbral (sin huecos ni solapes).
7. **Carril íntegro:** el efecto de carril no se ve reducido por el tope de mods.

## Qué NO hacer

- No sumar atributos en bruto (usa la compresión).
- No aplicar rendimientos decrecientes a potencia, influencia ni carril.
- No usar `Math.random`: la incertidumbre viene del PRNG sembrado.
- No inventar umbrales intermedios: son exactamente los de las dos tablas.