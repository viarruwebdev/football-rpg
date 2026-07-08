---
name: sim-harness
description: >-
  Cómo construir, correr e interpretar el harness de simulación del Football RPG
  (tools/sim): miles de duelos y partidos IA-vs-IA headless para validar el
  balance del motor contra las metas de calibración del manual. Úsala al tocar
  reglas del juego, calibrar probabilidades, o comprobar que un cambio no rompe
  las bandas (élite vs mediocre ~80-85%, azar ~33%). Palabras clave: simulación,
  harness, balance, calibración, tasas, IA-vs-IA, montecarlo, bandas, tools/sim.
---

# Harness de simulación — Football RPG

Convierte el diseño en algo falsable (constitución, Principio 6). "Se siente bien" no es medible; las tablas del manual sí. El harness corre muchísimos duelos/partidos deterministas y comprueba estadísticas agregadas contra bandas declaradas.

## Qué mide (bandas de calibración del §6)

Probabilidad de éxito del atacante por escenario (deben caer dentro de la banda):

| Escenario | Diferencia | Banda objetivo |
|---|---|---|
| Élite (+4) vs Pésimo (-4) | +8 | 90-95% |
| Élite (+4) vs Mediocre (-1) | +5 | 80-85% |
| Élite (+4) vs Bueno (+2) | +2 | 70-75% |
| Bueno (+2) vs Bueno (+2) | 0 | ~50% |
| Mediocre (-1) vs Élite (+4) | -5 | 15-20% (atacante) |

Pesos de los componentes (media ponderada objetivo): azar ≈ **33%**, decisión (cartas + carril) ≈ **31%**, preparación (atributos + mods) ≈ **37%**. Ningún factor debe dominar por encima de ~33%.

## Diseño del harness

- Vive en `tools/sim`, importa **solo** `packages/core` y `packages/content` (nunca la UI).
- Es determinista: recibe una **semilla maestra** y deriva una semilla por partido con el PRNG splittable. Reproducible al 100%.
- Corre N iteraciones (N grande: 10.000+ por escenario para tasas estables), acumula conteos y reporta.
- Sale con código ≠ 0 si alguna métrica cae fuera de su banda (para usarlo como puerta en CI/pre-commit).

```ts
// tools/sim/index.ts (esqueleto)
import { resolveDuel, makeRng } from "@core";

const N = 20_000;
function winRate(atkInfluence: number, defInfluence: number, seed: number) {
  const rng = makeRng(seed);
  let wins = 0;
  for (let i = 0; i < N; i++) {
    const r = resolveDuel(scenario(atkInfluence, defInfluence), rng.next());
    if (r.diferencial + r.incertidumbre >= 1) wins++;   // éxito del atacante
  }
  return wins / N;
}

const bands = [
  { name: "élite vs mediocre", atk: +4, def: -1, min: 0.80, max: 0.85 },
  { name: "bueno vs bueno",    atk: +2, def: +2, min: 0.45, max: 0.55 },
  // …
];

let ok = true;
for (const b of bands) {
  const wr = winRate(b.atk, b.def, 12345);
  const pass = wr >= b.min && wr <= b.max;
  ok &&= pass;
  console.log(`${pass ? "✅" : "❌"} ${b.name}: ${(wr * 100).toFixed(1)}% (banda ${b.min * 100}-${b.max * 100}%)`);
}
process.exit(ok ? 0 : 1);
```

## Cómo correrlo

```bash
pnpm sim                 # todos los escenarios con la semilla por defecto
pnpm sim -- --seed 777   # otra semilla maestra (las tasas deben ser estables entre semillas)
```

## Cómo interpretar los resultados

- **Dentro de banda:** el cambio respeta la calibración. Sigue.
- **Fuera de banda tras un cambio de reglas:** el cambio alteró el balance. Decide: (a) era intencional → actualiza la banda y documéntalo como ADR; (b) no era intencional → revísalo.
- **Tasas que oscilan mucho entre semillas:** N demasiado bajo (sube iteraciones) o hay no-determinismo colándose (revisa con la skill `core-determinism-guard`).
- **Un componente supera ~33% de peso:** el equilibrio decisión/preparación/azar se rompió; revisa mods, banda de incertidumbre o potencia de cartas.
- Los objetivos de calibración deben especificar si son por-matchup o agregados; un matchup extremo no se mide contra una banda agregada

## Extensiones útiles

- Simular **partidos completos** (64-68 jugadas) además de duelos sueltos, para validar marcadores medios y frecuencia de goles.
- Barridos IA-vs-IA entre perfiles del §28 para detectar builds dominantes.
- Exportar histogramas del factor de incertidumbre para verificar que la triangular es correcta.

## Qué NO hacer

- No ejecutar el harness contra código con `Math.random` (invalida la reproducibilidad).
- No "ajustar a ojo" un número hasta que la UI se sienta bien: ajusta y confirma contra las bandas.
- No importar la UI en `tools/sim`.
- No bajar N hasta que las tasas parezcan buenas; usa N alto y semillas múltiples.