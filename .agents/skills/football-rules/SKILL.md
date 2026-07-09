---
name: football-rules
description: >-
  Fuente de verdad de la resolución de duelos y el sistema de momentum del
  Football RPG (manual §6 y §7 unificado). Úsala SIEMPRE que implementes,
  pruebes o balancees cualquier cálculo de fuerza, diferencial, resultado,
  umbral, momentum, remate o modificador en packages/core. Palabras clave:
  duelo, resolución, fuerza, diferencial, umbral, carril, incertidumbre, banda,
  Composure, momentum, cap, remate, racha, degradación.
---

# Reglas de resolución y momentum — Football RPG (§6 + §7)

Esta skill codifica las reglas de las secciones 6 y 7 del manual. Es la **fuente de verdad** para el motor. Si un número aquí contradice tu memoria, gana esta skill; si contradice el manual de Notion, gana el manual (y actualiza esta skill).

Todos los cálculos viven en `packages/core` y deben ser **puros y deterministas** (ver skill `core-determinism-guard`).

---

## PARTE 1 — Resolución de duelos (§6)

### Fórmula base

```
FuerzaAtaque  = potenciaCarta + influenciaAtributo + modsSituacionales
FuerzaDefensa = potenciaCarta + influenciaAtributo + modsSituacionales + carril
Diferencial   = FuerzaAtaque − FuerzaDefensa
Resultado     = Diferencial + incertidumbre
```

`potenciaCarta`, `influenciaAtributo` y `carril` se aplican **íntegros** (sin rendimientos decrecientes ni cap).
Solo `modsSituacionales` sufren rendimientos decrecientes.

**ATENCIÓN — aritmética fraccional.** El momentum aporta valores fraccionales (+0.15/punto). El pipeline debe tolerar Fuerza, Diferencial y Resultado fraccionales. Los puntos de redondeo explícitos son: (1) el diferencial que alimenta `computeBand` (se redondea al entero más cercano para elegir tramo de banda), y (2) el Resultado final antes de `classify` (se redondea al entero más cercano para entrar en los umbrales). Cualquier otro punto de redondeo debe documentarse y testearse.

### Compresión de atributos (1-20 → -4..+4)

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

### Modificadores situacionales (rendimientos decrecientes)

Sin tope duro general, pero con retorno decreciente sobre el **bruto acumulado**:

- Puntos 1-4 → 100% (1:1)
- Puntos 5-8 → 50% (2:1)
- Puntos 9+ → 33% (3:1)

Ejemplos: +3→+3, +4→+4, +6→+5, +8→+6, +10→+7, +12→+7.

**Son mods** (sufren el decrecimiento): **momentum** (con su propio cap de ±0.75 aplicado ANTES de entrar aquí), Technique, First Touch, Important Matches, bonus de estilo, bonus de rol, bonus de química, condiciones de partido, presión acumulada por eslabón.

**El momentum tiene además un cap propio de ±0.75** antes de entrar en la tabla de rendimientos decrecientes. Es el **único modificador con cap propio**, porque se aplica a los 11 jugadores a la vez y sin él superaría el gap élite-medio. Ver Parte 2.

**NO son mods** (íntegros): potencia de carta, influencia de atributo, acierto/fallo de carril.

### Carril (mind-game)

El defensor apuesta carril (izquierda/centro/derecha):

- Acertó → **+2** al defensor.
- Falló → **-1** al defensor.
- Swing total: 3. NO entra en el tope de mods (íntegro).

Marking modifica la apuesta: 14+ revela 1 carril que NO es el destino; 17+ revela el correcto.

**En remates normales NO hay carril ni apuesta de palo.** La apuesta de palo es exclusiva de penaltis.

### Incertidumbre (distribución triangular)

Banda base **-6..+6**, triangular centrada en 0 (extremos raros: 0≈12%, ±1≈11%, ±2≈9%, ±3≈7%, ±4≈5%, ±5≈3%, ±6≈1% por lado).

**Banda dinámica** según diferencia efectiva (antes del azar), **redondeada al entero para elegir tramo**:

> ⚠️ **ADR-0001:** los valores de diseño del manual son 6/7/8. El código usa **10/11/12** (recalibrados tras corregir el muestreo triangular). Ver ADR.

- Diferencia 0-4 → ±10
- Diferencia 5-6 → ±11
- Diferencia 7+ → ±12

**Composure ajusta la banda** (se usa la Composure del jugador que **inicia la acción**):
- 8-14 → sin ajuste
- 15-17 → banda −1
- 18-20 → banda −2
- <8 → banda +1

**Suelo mínimo de banda: ±3** (nunca menos, por ninguna combinación).
**Técnica especial vs técnica especial: banda fija ±4.**

El muestreo usa **dos uniformes independientes vía `rng.split()`**, promediadas y escaladas. Nunca dos `next()` sobre el mismo `Rng` (ver `core-determinism-guard`).

### Secuencia exacta del duelo

1. Atacante elige carta + jugador + destino (incluye carril). Firme.
2. Instantes pre-revelado (Amague = info falsa al defensor; Visión periférica = revela apuesta del defensor).
3. Defensor elige carta + defensor + apuesta de carril. Firme.
4. Revelado simultáneo.
5. Efectos post-revelado que manipulan carril (Recorte, Ruleta, Regate doble, Enganche y salida).
6. Resolución: fórmula + incertidumbre + umbrales.

### Umbrales — eslabón normal

**La columna Momentum es una redirección a la Parte 2 (§7, tabla de duelos), NO un valor propio de esta tabla.** El manual lo dice explícitamente para evitar el solapamiento que existía entre §6 y §7 en versiones anteriores. Los valores reales de momentum de cada tramo están en "Fuentes — duelos consecutivos" más abajo — no los dupliques aquí.

| Resultado | Rango | Atacante | Defensor | Momentum |
|---|---|---|---|---|
| Éxito aplastante | ≥ +6 | Avanza + roba 1 carta | Superado (no defiende sig.) | Ver §7 (duelo ganado) |
| Éxito limpio | +3..+5 | Avanza | — | — |
| Avance forzado | +1..+2 | Avanza +presión +1 | Reposiciona | — |
| Balón dividido | 0 | Mini-duelo | Mini-duelo | — |
| Pérdida simple | -1..-2 | Pierde balón | Inicia posesión | — |
| Pérdida con desventaja | -3..-5 | Pierde balón | Transición +2 | Ver §7 (pérdida) |
| Contragolpe devastador | ≤ -6 | Pierde + descolocado | Salto de zona +3 | Ver §7 (devastador) |

### Umbrales — remate (tiro vs portero)

| Resultado | Rango | Efecto |
|---|---|---|
| Gol imparable | ≥ +5 | Gol, +2 momentum |
| Gol | +3..+4 | Gol, +2 momentum |
| Gol con rebote | +1..+2 | Gol, +2 momentum, portero sin fatiga extra |
| Paradón | 0 | No gol, córner, +1 momentum defensor |
| Parada sólida | -1..-2 | No gol, portero atrapa, inversión de roles |
| Parada y contragolpe | ≤ -3 | No gol, rival desde tercio medio +2 |

Mods de remate: asistencia previa +3; cabezazo tras centro +2; avance forzado previo -2; disparo lejano desde Ataque -3 (Long Shots 16+ reduce en 2, 18+ elimina); disparo lejano desde Medio -5; ángulo lateral del Área -2. En remates normales NO hay componente de carril.

### Balón dividido (resultado 0)

Ambos deciden a la vez **forzar** (gasta 1 energía, +2 fuerza) o **ceder**. Ambos fuerzan → nuevo aleatorio banda -2/+2, ganador +1 momentum. Atacante fuerza/def cede → atacante avanza lateral. Def fuerza/atac cede → defensor roba, misma zona. Ambos ceden → balón fuera, 1 jugada consumida.

### Pesos objetivo (para el harness de balance)

Azar ≈ **33%**, decisión del jugador (cartas + carril) ≈ **31%**, preparación (atributos + mods) ≈ **37%**. Calibración de referencia (FM): élite vs mediocre ≈ **80-85%**; élite vs pésimo ≈ 90-95%; bueno vs bueno ≈ 50%.

---

## PARTE 2 — Sistema de momentum (§7 unificado)

El momentum es la "inercia" de un equipo dentro del partido. Barra **por equipo**, oscila entre **-5 y +5** en pasos de **0.5**, empieza en 0. Se mueve por eventos significativos **y** por duelos ganados consecutivamente.

### Fuentes — eventos significativos (lista cerrada, 9 filas)

El **éxito aplastante** (±6) NO está en esta tabla — se procesa exclusivamente por la tabla de duelos (abajo), como cualquier otro tramo de `DuelSegment`.

| Evento | Delta |
|---|---|
| Marcar gol | +2 |
| Encajar gol | -2 |
| Gol contra la marea (solo si tu momentum es negativo) | +3 inversión |
| Técnica especial exitosa por diferencial +5 o más | +1 |
| Parada épica del portero (técnica especial) | +1 |
| Portero ataja un mano a mano | +1 |
| Robo de balón en zona avanzada (pressing) | +1 |
| Racha de posesión (3+ duelos ganados en la misma posesión) | +1 |
| Paradón estándar (tiro vs portero, resultado 0) | +1 defensor |

### Fuentes — duelos consecutivos (la antigua Racha, integrada)

Cobertura **exhaustiva**: los siete tramos del §6 tienen regla. No hay resultado de duelo de eslabón huérfano.

| Resultado del duelo | Delta | ¿Cuenta como duelo ganado? |
|---|---|---|
| Éxito aplastante (≥ +6) | **+1** (sustituye al +0.5, no lo suma) | Sí (incrementa consecutivos) |
| Éxito limpio (+3..+5) — *"duelo ganado"* | +0.5 | Sí (incrementa consecutivos) |
| Avance forzado (+1..+2) | **No mueve** | **No** (ni incrementa ni resetea) |
| Balón dividido (0) | No mueve | No (ni incrementa ni resetea) |
| Pérdida simple (-1..-2) | -1 | No — **resetea** consecutivos |
| Pérdida con desventaja (-3..-5) | -1.5 | No — **resetea** consecutivos |
| Contragolpe devastador (-6) | -2 | No — **resetea** consecutivos |

**Definición de "duelo ganado":** solo el **éxito limpio** (+3..+5) y el **éxito aplastante** (≥+6). El **avance forzado** (+1..+2) NO cuenta: el atacante progresa con presión pero el defensor no queda batido — es progresión, no dominio.

**Reset del contador de consecutivos:** solo lo resetea **perder** el duelo (−1 o peor). Los resultados neutros (avance forzado, balón dividido) no lo incrementan pero tampoco lo rompen.

**Las dos tablas son EXCLUYENTES por diseño.** Los duelos de eslabón normal se procesan **solo** por la tabla de duelos; la tabla de eventos cubre lo que no es un resultado de duelo de eslabón. Un resultado de -6 dispara SOLO la tabla de duelos (-2). Un resultado de +6 dispara SOLO la tabla de duelos (+1).

**Excepción documentada:** los duelos tiro-vs-portero (remate) se procesan por la tabla de **eventos** cuando el resultado es un gol o un paradón estándar.

**Dentro de la tabla de duelos, gana el tramo más específico**, sin acumular: un -6 aplica -2, no -2 más -1.5 más -1.

**Las dos tablas SÍ se suman** cuando ambas aplican al mismo momento por vías distintas. Ejemplo: ganar el tercer duelo consecutivo de una posesión por éxito aplastante da +1 (tabla de duelos) + +1 (racha de posesión, tabla de eventos) = +2.

**`resolveDuel` NO emite eventos de momentum.** Emite el tramo (`DuelSegment`); el sistema de momentum lo traduce vía la tabla de duelos. `resolveShot` sí emite eventos (gol, paradón estándar), por la excepción del remate.

### Efecto continuo: +0.15 de Fuerza por punto, cap ±0.75

El momentum es un **modificador de Fuerza**, NO de atributos ni de influencia. Entra en el bruto acumulado de mods situacionales y **sí** sufre rendimientos decrecientes con el resto.

| Barra | Contribución bruta |
|---|---|
| ±1 | ±0.15 |
| ±2 | ±0.30 |
| ±3 | ±0.45 |
| ±4 | ±0.60 |
| ±5 | ±0.75 (cap duro) |

**El cap de ±0.75 se aplica ANTES de entrar en los rendimientos decrecientes.** Si una semilla o pacto amplifica el momentum (ej. "Momentum amplificado", ×2), el efecto sigue capado en ±0.75.

### Cap efectivo total en +5

Contribución continua (+0.75) + jugador "en la zona" (+1 influencia individual, participa en ~35% de duelos ≈ +0.35 sostenido) = **~+1.10 de Fuerza sostenida**. Los efectos de carta de umbral son puntuales, no sostenidos.

Comprobación de jerarquía (cifras exactas del manual, no recalcular de memoria): medio encendido = +0.5 (influencia) + 0.75 (Fuerza continua) = **+1.25 de Fuerza directa**; **+1.60** incluyendo "en la zona" promediado (+0.35). Élite frío = +3.5 − 0.75 = **+2.75 de Fuerza directa**; **+2.40 neto** incluyendo que el "en la zona" del oponente le resta ventaja relativa (no resta de su propia Fuerza, suma a la del rival — equivalente en el duelo). El élite gana por **1.50 en Fuerza directa** y por **0.80 neto**. **La jerarquía de calidad se preserva en ambos cálculos.**

### Bonus por umbrales (one-shot, capa de cartas)

Estos son el grueso del efecto visible del momentum. No son sostenidos; se disparan **una vez** al cruzar el umbral. Simétricos en negativo.

**Re-armado del one-shot:** el efecto se re-arma (puede dispararse de nuevo) solo cuando la barra cae **estrictamente por debajo** del valor del umbral (condición `barAfter < threshold`, no `<=`). Una barra que aterriza exactamente en el umbral (ej. +4 → +3 por degradación) sigue contando como "cruzado": el one-shot permanece gastado y no se vuelve a disparar en el siguiente +0.5. Solo cuando la barra llega a +2.5 o menos se re-arma el umbral +3. **No cambies `<` a `<=` pensando que es un off-by-one: es semántica intencional.**

| Umbral | Bonus positivo | Bonus negativo |
|---|---|---|
| +3 / -3 | Tu siguiente carta +1 potencia (un duelo) | Tu siguiente carta -1 potencia |
| +4 / -4 | Robas 1 carta extra (una vez) | Robas 1 carta menos |
| +5 / -5 | 1 jugador "en la zona": +1 influencia individual resto del partido (sobrevive aunque baje la barra; marca visual). Se desbloquea carta "Jugada perfecta" (potencia 6, 1 uso) | 1 jugador **rival** entra "en la zona" (mismo efecto: +1 influencia individual, sobrevive). **NO desbloquea "Jugada perfecta"** — esa carta es exclusiva del +5 propio, sin contraparte en -5 (asimetría deliberada, no simétrica como ±3/±4). |

"En la zona" es la **única** excepción donde el momentum toca influencia individual. Sobrevive al descenso de la barra.

### Bonus post-partido por momentum máximo

El sistema **registra el máximo alcanzado** por partido (no baja con degradación). Los bonus se resuelven al terminar el partido.

| Máximo alcanzado | Bonus |
|---|---|
| +4 | +1 opción en la recompensa |
| +5 | +1 opción + recompensa mejorada |
| +5 durante 5+ jugadas | Todo lo anterior + jugador "en la zona" gana +1 CA permanente |

### Degradación (asimétrica, por posesión)

**Positivo:** -1 por cada posesión **sin evento significativo ni duelo ganado**. Mantenerlo exige acción constante.

**Negativo:** -1 hacia 0 en **cada** posesión (no solo sin evento). Más rápido que el positivo.

**Determination alta:** equipo con Determination media 16+ pasa de -2 a 0 en **1 posesión** en vez de 2.

**La degradación nunca cruza el 0** (no pasa de positivo a negativo ni viceversa).

### Saturación

La barra se satura en **±5**; sumar por encima no la pasa de 5 ni por debajo de -5.

### Estado que mantiene el sistema

- Barra por equipo (fraccional, en pasos de 0.5, rango [-5, +5]).
- Contador de duelos consecutivos ganados (por equipo, se resetea al perder).
- Máximo alcanzado por equipo en el partido (para bonus post-partido).
- Registro de umbrales cruzados (para los one-shot: +3/+4/+5 solo disparan una vez por cruce).
- Jugador "en la zona" (si se disparó +5; sobrevive al descenso).

### Interacción con rasgos (referencia, no implementar en 003-v1)

- **Sangre fría:** en el descuento, pérdida simple (-1/-2) no baja momentum.
- **Precipitado:** perder un duelo baja -1.5 en vez de -1.
- **Defensor implacable:** duelos defensivos ganados dan +1 en vez de +0.5.
- **Organizador:** pases cortos exitosos con momentum 3+ regeneran +1 energía cada 3 eslabones.

---

## Invariantes verificables (property-based)

Escribe estas propiedades con fast-check en `packages/core`:

1. **Determinismo:** `resolveDuel(input, seed)` da el mismo resultado para la misma semilla.
2. **Rango de influencia:** la influencia de atributo siempre ∈ [-4, +4].
3. **Suelo de banda:** la banda de incertidumbre nunca es menor que ±3.
4. **Monotonía de mods:** aumentar un mod bruto nunca reduce el mod efectivo.
5. **Cap de momentum:** la contribución bruta del momentum nunca supera ±0.75.
6. **Cobertura de tramos:** todo `Resultado` (redondeado al entero) cae en exactamente un umbral (sin huecos ni solapes).
7. **Carril íntegro:** el efecto de carril no se ve reducido por el tope de mods.
8. **Saturación de barra:** la barra de momentum nunca sale de [-5, +5].
9. **Degradación no cruza 0:** la degradación nunca lleva una barra positiva a negativa ni viceversa.
10. **Máximo no baja:** el máximo alcanzado es mayor o igual que el máximo anterior tras cualquier operación.

## Qué NO hacer

- No sumar atributos en bruto (usa la compresión).
- No aplicar rendimientos decrecientes a potencia, influencia ni carril.
- No usar `Math.random`: la incertidumbre viene del PRNG sembrado.
- No inventar umbrales intermedios: son exactamente los de las tablas.
- No llamar a `rng.next()` dos veces sobre el mismo Rng sin `split()`.
- No aplicar el momentum como influencia (es modificador de Fuerza, con cap y rendimientos decrecientes).
- No ignorar el cap de ±0.75 en ninguna circunstancia (incluidas semillas/pactos amplificados).
- No tratar los umbrales +3/+4/+5 como sostenidos: son one-shot al cruzar.