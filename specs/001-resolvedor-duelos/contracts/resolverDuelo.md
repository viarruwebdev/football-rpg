# Contrato — `resolverDuelo`

**Módulo**: `packages/core/src/duel/resolverDuelo.ts`
**Exportado desde**: `packages/core/src/duel/index.ts`

---

## Firma

```typescript
import type { Rng } from '../rng/types';
import type { EntradaDeDuelo, ResultadoDeDuelo } from './types';

export function resolverDuelo(
  entrada: EntradaDeDuelo,
  rng: Rng,
): ResultadoDeDuelo;
```

---

## Precondiciones

| Campo | Restricción |
|-------|------------|
| `ataque.atributo` | Entero 1-20 |
| `defensa.atributo` | Entero 1-20 |
| `ataque.composure` | Entero 1-20 |
| `defensa.composure` | Entero 1-20 |
| `ataque.carrilElegido` | Definido (requerido en duelo normal) |
| `defensa.carrilApostado` | Definido (requerido en duelo normal) |
| `rng` | Instancia válida de `Rng`; nunca `null`/`undefined` |

No se lanzan excepciones por valores fuera de rango — el resolvedor es una función pura de producción; la validación de entrada ocurre en la capa de integración con Zod antes de llegar aquí.

---

## Postcondiciones

1. `resultado.tramo` corresponde exactamente al tramo definido por `resultado.resultado` según la tabla del §6.
2. `resultado.eventos` contiene exactamente los eventos definidos para ese tramo (ver data-model.md).
3. Llamar `resolverDuelo(entrada, rng)` dos veces con el mismo `entrada` y el mismo `rng` (en el mismo estado inicial) produce resultados idénticos.
4. `rng` no muta: el estado del generador tras la llamada es observable solo a través del valor retornado, no de efectos sobre el argumento.

---

## Uso de `rng`

```
resolverDuelo
  └─ rng.split() → rng_incertidumbre   (muestreo triangular)
  └─ (futuros sub-cálculos usarán splits adicionales)
```

`resolverDuelo` consume exactamente un `split()` del `rng` recibido en v1, y pasa ese hijo a `sampleTriangular`. Como `Rng` es inmutable, `computeBand` no recibe rng (es pura) y no hay riesgo de compartir secuencia.

---

## Ejemplo de uso (test / harness)

```typescript
import { makeRng } from '@football-rpg/core/rng';
import { resolverDuelo } from '@football-rpg/core/duel';

const entrada: EntradaDeDuelo = {
  ataque: {
    potenciaCarta: 3,
    atributo: 16,        // influencia +3
    modificadores: [2, 1],
    carrilElegido: 'derecha',
    composure: 14,
    tecnicaEspecial: undefined,
  },
  defensa: {
    potenciaCarta: 2,
    atributo: 10,        // influencia 0
    modificadores: [1],
    carrilApostado: 'izquierda', // falla el carril → −1
    composure: 12,
    tecnicaEspecial: undefined,
  },
};

const rng = makeRng(42);
const r1 = resolverDuelo(entrada, rng);
const r2 = resolverDuelo(entrada, rng); // mismo rng, mismo estado inicial

// CE-001: determinismo garantizado
assert.deepEqual(r1, r2);
```

---

## Guardianes de determinismo (`core-determinism-guard`)

Ninguna ruta de `packages/core` puede contener los siguientes patrones. Verificar antes de cerrar la feature:

```bash
# Fuentes de no-determinismo prohibidas
grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" \
  packages/core/src && echo "❌ no-determinismo" || echo "✅ core limpio"

# Aislamiento de capas
grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src \
  && echo "❌ core importa de la UI" || echo "✅ dependencias correctas"
```

`resolverDuelo` no debe mutar `entrada` ni `rng`. Devuelve siempre un nuevo `ResultadoDeDuelo`.

---

## Invariantes verificables con fast-check (`football-rules` §invariantes)

| # | Propiedad | Descripción |
|---|-----------|-------------|
| 1 | **Determinismo** | `resolverDuelo(input, rng) deepEqual resolverDuelo(input, rng)` para todo input y rng arbitrarios |
| 2 | **Rango de influencia** | `attributeToInfluence(n)` ∈ [−4, +4] para todo `n` ∈ [1, 20] |
| 3 | **Suelo de banda** | La banda de incertidumbre nunca es < ±3 para ninguna combinación de Composure y diferencial |
| 4 | **Monotonía de mods** | Aumentar un modificador bruto nunca reduce el modificador efectivo (`applyDiminishing`) |
| 5 | **Techo de momentum** | El `delta` de los eventos de momentum nunca supera ±2 en v1 |
| 6 | **Cobertura de umbrales** | Todo entero posible cae en exactamente un `Tramo` (sin huecos ni solapamientos) |
| 7 | **Carril íntegro** | El efecto de carril (+2/−1) nunca se ve reducido por `applyDiminishing` |

---

## Módulos de soporte (API interna)

| Módulo | Función exportada | Responsabilidad |
|--------|------------------|----------------|
| `rng/types.ts` | `Rng`, `makeRng` | Interfaz e instanciación del generador |
| `duel/attributeToInfluence.ts` | `attributeToInfluence(n: number): number` | Tabla de compresión 1-20 → −4..+4 |
| `duel/modifiers.ts` | `applyDiminishing(mods: number[]): number` | Rendimientos decrecientes 100%/50%/33% |
| `duel/uncertainty.ts` | `computeBand(diferencial: number, composureAtacante: number, tecnicaEspecialAmbos: boolean): number` | Banda efectiva: dinámica + ajuste Composure + suelo ±3 (o ±4 fija si técnica especial) |
| `duel/uncertainty.ts` | `sampleTriangular(banda: number, rng: Rng): number` | Muestreo triangular discreto en [−banda, +banda] |
| `duel/classify.ts` | `classify(resultado: number): Tramo` | Mapeo número → uno de los siete tramos |
| `duel/events.ts` | `emitEvents(tramo: Tramo): Evento[]` | Tabla tramo → lista de eventos |
