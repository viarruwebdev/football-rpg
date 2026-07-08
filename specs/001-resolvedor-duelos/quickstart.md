# Guía de validación — Resolvedor de duelos

**Feature**: 001-resolvedor-duelos | **Fecha**: 2026-07-08

---

## Prerequisitos

```bash
node --version   # ≥ 18
pnpm --version   # ≥ 9
pnpm install     # desde la raíz del monorepo
```

---

## Escenario 1 — Determinismo (CE-001)

Verifica que el mismo duelo con el mismo Rng produce siempre el mismo resultado.

```bash
pnpm test --filter @football-rpg/core -- resolverDuelo
```

**Resultado esperado**: todos los tests en verde, incluyendo el test de determinismo que resuelve el mismo duelo dos veces y compara los resultados con `deepEqual`.

---

## Escenario 2 — Calibración (CE-002, vía harness)

Verifica que las tasas de éxito en simulación masiva caen dentro de las bandas del manual.

```bash
pnpm sim
```

**Resultado esperado** (cuando el harness esté implementado):
- Élite (+4) vs mediocre (−1): 80-85% de éxito para el atacante
- Élite vs pésimo: 90-95%
- Bueno vs bueno (±0): ≈50%

---

## Escenario 3 — Suelo de banda (CE-004, property-based)

```bash
pnpm test --filter @football-rpg/core -- resolverDuelo.property
```

**Resultado esperado**: fast-check confirma que en ninguna combinación de Composure y diferencia la incertidumbre muestreada cae fuera de ±3.

---

## Escenario 4 — Cobertura de tramos (CE-005, property-based)

El mismo test de CE-004 incluye la propiedad de cobertura: todo resultado numérico posible cae en exactamente un tramo (sin huecos ni solapamientos).

---

## Escenario 5 — Criterios BDD

```bash
pnpm test --filter @football-rpg/core -- cucumber
```

Los escenarios de `features/001-resolvedor-duelos.feature` (Gherkin con semilla fija) deben pasar:
- Atacante superior tiende a tramos favorables pero deja posibilidad al inferior.
- Acierto de carril da +2; fallo da −1 (swing exacto de 3 puntos).
- Resultado 0 emite exactamente el evento `miniDuelo`.

---

## Escenario 6 — Pureza del núcleo (`core-determinism-guard`)

Antes de cerrar la feature, verificar que no se coló ninguna fuente de no-determinismo:

```bash
grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" \
  packages/core/src && echo "❌ FALLO" || echo "✅ core limpio"

grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src \
  && echo "❌ FALLO" || echo "✅ capas correctas"
```

**Resultado esperado**: ambos greps salen con `✅` (código 1, sin coincidencias).

---

## Escenario 7 — Puerta de calidad completa

```bash
pnpm type && pnpm check && pnpm test
```

Los tres comandos deben salir con código 0 antes de considerar la feature terminada.

---

## Referencias

- Tipos y entidades: [data-model.md](./data-model.md)
- Contrato de la función: [contracts/resolverDuelo.md](./contracts/resolverDuelo.md)
- Reglas del juego: manual §6 (Tabla de Resolución) · skill `football-rules`
- Harness de simulación: skill `sim-harness` · `tools/sim/`
