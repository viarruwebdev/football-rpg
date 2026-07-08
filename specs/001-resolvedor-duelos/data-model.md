# Modelo de datos — Resolvedor de duelos

**Feature**: 001-resolvedor-duelos | **Fecha**: 2026-07-08

Todos los tipos viven en `packages/core/src/duel/types.ts` salvo `Rng` que vive en `packages/core/src/rng/types.ts`.

---

## Rng

```typescript
// packages/core/src/rng/types.ts
export interface Rng {
  /** Devuelve un float en [0, 1). No muta el receptor. */
  next(): number;
  /** Devuelve un generador hijo independiente. No muta el receptor. */
  split(): Rng;
}

/** Punto de entrada externo: convierte una semilla numérica en un Rng. */
export declare function makeRng(seed: number): Rng;
```

**Invariantes**:
- `makeRng(s).next()` produce siempre el mismo valor para el mismo `s`.
- `rng.split()` devuelve un hijo cuya secuencia difiere de la del padre y de otros hijos.
- Ninguna llamada a `next()` ni `split()` muta el receptor (implementación inmutable vía cierre o clase con estado copiado).

---

## Lado (LadoDuelo)

```typescript
export type Carril = 'izquierda' | 'centro' | 'derecha';

export interface LadoDuelo {
  /** Potencia base de la carta jugada (número entero, rango según catálogo). */
  potenciaCarta: number;
  /** Atributo clave del jugador, escala 1-20. */
  atributo: number;
  /** Modificadores situacionales activos (momentum, Technique, First Touch,
   *  Important Matches, estilo, rol, química, condiciones, presión acumulada…).
   *  Entran en el cálculo de rendimientos decrecientes. */
  modificadores: number[];
  /** Solo en el lado atacante: carril elegido como destino del ataque. */
  carrilElegido?: Carril;
  /** Solo en el lado defensor: carril apostado para anticipar el ataque. */
  carrilApostado?: Carril;
  /** Valor de Composure del jugador (1-20). Ajusta la banda de incertidumbre. */
  composure: number;
  /** Punto de extensión v1: id opaco de la técnica especial, si la carta la tiene. */
  tecnicaEspecial?: TecnicaEspecialId;
}

/** Identificador opaco de técnica especial. El catálogo llega en feature posterior. */
export type TecnicaEspecialId = string;
```

---

## EntradaDeDuelo

```typescript
export interface EntradaDeDuelo {
  ataque: LadoDuelo;
  defensa: LadoDuelo;
  /** Puntos de extensión para instantes pre-revelado (catálogo en feature posterior). */
  instantesPreRevelado?: unknown[];
  /** Puntos de extensión para efectos post-revelado de carril (catálogo en feature posterior). */
  efectosPostRevelado?: unknown[];
}
```

**Nota**: la semilla no es un campo de `EntradaDeDuelo`. El `Rng` entra como segundo argumento de `resolverDuelo`.

---

## Tramo

```typescript
export type Tramo =
  | 'exitoAplastante'      // Resultado ≥ +6
  | 'exitoLimpio'          // Resultado +3..+5
  | 'avanceForzado'        // Resultado +1..+2
  | 'balonDividido'        // Resultado = 0
  | 'perdidaSimple'        // Resultado −1..−2
  | 'perdidaConDesventaja' // Resultado −3..−5
  | 'contragolpeDevastador'; // Resultado ≤ −6
```

**Invariante CE-005**: todo entero posible cae en exactamente uno de los siete tramos. Sin huecos, sin solapamientos.

---

## Evento

```typescript
export type Evento =
  | { tipo: 'avance';      lado: 'ataque' | 'defensa' }
  | { tipo: 'roboCarta';   lado: 'ataque' | 'defensa' }
  | { tipo: 'momentum';    lado: 'ataque' | 'defensa'; delta: number }
  | { tipo: 'presion';     delta: number }   // presión defensiva acumulada por eslabón
  | { tipo: 'transicion' }
  | { tipo: 'miniDuelo' };
```

**Reglas de emisión por tramo** (fuente: §6, tabla de eslabón normal):

| Tramo | Resultado | Eventos emitidos |
|-------|-----------|-----------------|
| `exitoAplastante` | ≥ +6 | `avance(ataque)`, `roboCarta(ataque)`, `momentum(ataque, +1)` |
| `exitoLimpio` | +3..+5 | `avance(ataque)` |
| `avanceForzado` | +1..+2 | `avance(ataque)`, `presion(+1)` |
| `balonDividido` | 0 | `miniDuelo` |
| `perdidaSimple` | −1..−2 | `transicion` |
| `perdidaConDesventaja` | −3..−5 | `transicion`, `momentum(defensa, +1)` |
| `contragolpeDevastador` | ≤ −6 | `transicion`, `roboCarta(defensa)`, `momentum(defensa, +2)` |

> Los eventos de `momentum` y `presion` son señales; sus sistemas (features futuras) los consumen. El resolvedor los emite pero no los aplica.

---

## ResultadoDeDuelo

```typescript
export interface ResultadoDeDuelo {
  /** Valor numérico entero: Diferencial + incertidumbre. */
  resultado: number;
  /** Tramo en el que cae el resultado. */
  tramo: Tramo;
  /** Eventos a despachar a capas superiores, en orden. */
  eventos: Evento[];
}
```

---

## Tabla de compresión atributo → influencia

| Atributo (1-20) | Influencia |
|-----------------|-----------|
| 1-3 | −4 |
| 4-5 | −3 |
| 6-7 | −2 |
| 8-9 | −1 |
| 10-11 | 0 |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-20 | +4 |

---

## Parámetros de la distribución triangular

La banda la calcula `computeBand(diferencial, composureAtacante, tecnicaEspecialAmbos)` (función pura, sin `rng`); el muestreo lo hace `sampleTriangular(banda, rng)`.

| Diferencia efectiva `|diferencial|` | Banda base |
|--------------------------------------|-----------|
| 0-4 | ±6 |
| 5-6 | ±7 |
| 7+ | ±8 |

**Ajuste por Composure del atacante**:

| Composure | Ajuste de banda |
|-----------|----------------|
| ≥ 18 | −2 (banda más estrecha) |
| 15-17 | −1 |
| 8-14 | 0 |
| < 8 | +1 (banda más ancha) |

**Suelo mínimo**: la banda resultante nunca baja de ±3 (CE-004).

**Caso técnica especial**: si ambos lados traen `tecnicaEspecial`, banda fija ±4 (ignora diferencial y Composure).
