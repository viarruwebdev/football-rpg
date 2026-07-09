# 6. Tabla de Resolución

# Fórmula base

**Fuerza de ataque** = Potencia de la carta + Influencia del atributo + Modificadores situacionales

**Fuerza de defensa** = Potencia de la carta + Influencia del atributo + Modificadores situacionales + Carril

**Diferencial** = Fuerza de ataque − Fuerza de defensa

**Resultado** = Diferencial + Factor de incertidumbre

---

# Escala de influencia de atributos

Los atributos (1-20) NO se suman en bruto a la fuerza. Se convierten a una escala comprimida de **-4 a +4** que evita el determinismo y mantiene al underdog con opciones reales.

| Atributo (1-20) | Influencia |
| --- | --- |
| 1-3 | -4 |
| 4-5 | -3 |
| 6-7 | -2 |
| 8-9 | -1 |
| 10-11 | 0 (neutro, jugador medio) |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-20 | +4 |

Referencia FM: Neil Brock (SI Games) afirmó que Messi marca "75 de cada 100" oportunidades de un tipo específico. Eso implica que incluso el mejor jugador del mundo falla el 25%. Un jugador mediocre (Finishing 10) tiene entre el 30-40% de éxito. Nuestro sistema comprimido reproduce estas tasas.

---

# Modificadores situacionales (rendimientos decrecientes)

Los modificadores NO tienen tope duro (cap), pero aplican con rendimientos decrecientes:

- Puntos 1 a 4: aplican al 100% (1:1)
- Puntos 5 a 8: aplican al 50% (2:1)
- Puntos 9 en adelante: aplican al 33% (3:1)

Ejemplos de conversión:

| Mods brutos | Cálculo | Mods efectivos |
| --- | --- | --- |
| +3 | 3 | +3 |
| +4 | 4 | +4 |
| +6 | 4 + (2÷2) | +5 |
| +8 | 4 + (4÷2) | +6 |
| +10 | 4 + 2 + (2÷3) | +7 |
| +12 | 4 + 2 + (4÷3) | +7 |

Fuentes que entran como modificadores situacionales: momentum, Technique, First Touch, Important Matches, bonus de estilo de juego, bonus de rol, bonus de química, condiciones de partido, presión acumulada por eslabón.

**El momentum tiene además su propio cap duro de ±0.75** (+0.15 por punto de barra) antes de entrar en esta tabla. Es el único modificador con cap propio, porque se aplica a los 11 jugadores a la vez y sin él superaría el gap élite-medio. Ver sección 7.

Lo que NO es modificador (se aplica íntegro siempre): la potencia de la carta, la influencia del atributo y el acierto/fallo de carril.

Así, un jugador con Technique 20 (que aporta +2 a sus cartas) siempre se diferencia de uno con Technique 14 (que aporta +0). Cada punto suma algo, pero cada vez menos. Los atributos secundarios de élite importan.

---

# Factor de incertidumbre

Banda base: **-6 a +6**, distribución triangular (centrada en 0, extremos raros).

| Valor | Probabilidad aproximada |
| --- | --- |
| 0 | ~12% |
| ±1 | ~11% cada lado |
| ±2 | ~9% cada lado |
| ±3 | ~7% cada lado |
| ±4 | ~5% cada lado |
| ±5 | ~3% cada lado |
| ±6 | ~1% cada lado |

## Banda dinámica (se ensancha con ventaja grande)

Cuando la diferencia de fuerza (antes del azar) entre atacante y defensor supera cierto umbral, la banda se ensancha. Esto refleja que en partidos "fáciles" los accidentes son más memorables.

- Diferencia efectiva 0 a 4: banda ±6 (normal)
- Diferencia efectiva 5 a 6: banda ±7
- Diferencia efectiva 7+: banda ±8

## Composure ajusta la banda

| Composure | Ajuste |
| --- | --- |
| Normal (8-14) | Sin ajuste |
| 15-17 | Banda -1 (ej: ±6 → ±5) |
| 18-20 | Banda -2 (ej: ±6 → ±4) |
| Bajo (<8) | Banda +1 (ej: ±6 → ±7) |

**Suelo mínimo de banda: ±3.** Nunca baja de aquí por ninguna combinación.

## Técnica especial vs técnica especial

Banda fija ±4. Suficientemente estrecha para que la preparación mande, pero con 5-10% de sorpresa.

---

# Acierto/fallo de carril

El defensor apuesta a qué carril va el balón (izquierda, centro, derecha).

| Resultado de la apuesta | Efecto |
| --- | --- |
| Defensor acertó el carril | +2 bonus defensivo |
| Defensor falló el carril | -1 penalización al defensor |
| Swing total | 3 puntos |

El carril NO entra en el tope de modificadores: se aplica siempre íntegro.

Marking alto modifica la apuesta: Marking 14+ revela 1 carril que NO es el destino. Marking 17+ revela el carril correcto directamente.

## Secuencia exacta de un duelo

1. El atacante elige carta + jugador + destino (incluyendo carril). Elección firme.
2. Instantes pre-revelado se juegan aquí (Amague da info falsa al defensor, Visión periférica revela apuesta del defensor).
3. El defensor elige carta + defensor + apuesta de carril. Elección firme.
4. Revelado simultáneo.
5. Efectos post-revelado de cartas que manipulan el carril (Recorte, Ruleta, Regate doble, Amago y salida). Estos no cambian el carril declarado: modifican cómo se compara el resultado.
6. Resolución: fórmula + incertidumbre + umbrales.

## Apuesta de palo: solo en penaltis

En remates normales NO hay apuesta de palo del portero. El duelo es tiro (carta + atributo) vs parada (carta + atributo), sin mind-game de palo. La apuesta de palo (tirador elige carril izq/centro/der, portero elige carril) es exclusiva de los penaltis.

---

# Umbrales de resultado — Eslabón normal

| Resultado | Rango | Efecto atacante | Efecto defensor | Momentum |
| --- | --- | --- | --- | --- |
| Éxito aplastante | +6 o más | Avanza + roba 1 carta | Superado (no defiende siguiente) | Ver §7 (duelo ganado) |
| Éxito limpio | +3 a +5 | Avanza | — | — |
| Avance forzado | +1 a +2 | Avanza con presión extra +1 | Reposiciona | — |
| Balón dividido | 0 | Mini-duelo | Mini-duelo | — |
| Pérdida simple | -1 a -2 | Pierde balón | Inicia posesión | — |
| Pérdida con desventaja | -3 a -5 | Pierde balón | Transición +2 bonus | Ver §7 (pérdida) |
| Contragolpe devastador | -6 o menos | Pierde + descolocado | Salto de zona +3 bonus | Ver §7 (devastador) |

**Nota sobre la columna Momentum de las tablas de umbrales:** los valores de momentum por resultado de duelo se gestionan EXCLUSIVAMENTE en la sección 7 (tabla de duelos). Las referencias "Ver §7" en las tablas de esta sección son redirecciones, no valores propios. Esto evita el solapamiento que existía anteriormente entre las dos secciones.

# Umbrales de resultado — Remate (tiro vs portero)

| Resultado | Rango | Efecto |
| --- | --- | --- |
| Gol imparable | +5 o más | Gol, +2 momentum |
| Gol | +3 a +4 | Gol, +2 momentum |
| Gol con rebote | +1 a +2 | Gol, +2 momentum, portero sin fatiga extra |
| Paradón | 0 | No gol, córner, +1 momentum defensor (ver §7: Paradón estándar) |
| Parada sólida | -1 a -2 | No gol, portero atrapa, inversión de roles |
| Parada y contragolpe | -3 o menos | No gol, rival desde tercio medio +2 bonus |

## Modificadores específicos de remate

- Asistencia previa: +3 al tiro
- Centro previo: cabezazos +2, otros sin bonus
- Eslabón previo con avance forzado: -2 al tiro
- Disparo lejano desde Ataque: -3 (Long Shots 16+ reduce en 2; 18+ elimina)
- Disparo lejano desde Medio: -5
- Ángulo carril lateral del Área: -2 al tiro
- Portero fatigándose: +1 fatiga temporal tras cada parada

---

# Mini-duelo de balón dividido

Cuando el resultado es exactamente 0. Ambos deciden simultáneamente: **forzar** (gastan 1 energía, +2 fuerza) o **ceder**.

- **Ambos fuerzan:** nuevo aleatorio en banda -2/+2. Ganador se lleva balón + +1 momentum.
- **Atacante fuerza, defensor cede:** atacante se lleva el balón, solo avanza lateralmente.
- **Defensor fuerza, atacante cede:** defensor roba, sin transición (misma zona).
- **Ambos ceden:** balón fuera. 1 jugada del reloj sin que nadie gane. Atacante reinicia cadena.

---

# Resolución de técnicas especiales

**Paso 1:** Atacante revela técnica. El rival decide si responde con técnica propia o carta normal.

**Paso 2:** Técnica vs técnica = banda ±4 (más predecible, gana el mejor preparado).

**Paso 3:** Técnica de ataque vs defensa normal = umbrales se desplazan +2 a favor del atacante.

**Paso 4:** Técnicas que ganan por +5 o más generan evento de impacto: +1 atributo temporal al jugador durante el resto del partido. Golazo especial = +2 momentum (gol) + +1 (técnica exitosa) = +3 total. Coherente con las dos tablas de la §7 sumadas sin solapamiento: el gol es un evento (+2), la técnica exitosa es otro evento (+1).

---

# Probabilidades resultantes (alineadas con FM)

| Escenario | Prob. éxito atacante | Prob. éxito defensor |
| --- | --- | --- |
| Élite (+4) vs Pésimo (-4), dif. +8 | ~90-95% | ~5-10% |
| Élite (+4) vs Mediocre (-1), dif. +5 | ~80-85% | ~15-20% |
| Élite (+4) vs Bueno (+2), dif. +2 | ~70-75% | ~25-30% |
| Bueno (+2) vs Bueno (+2), dif. 0 | ~50% | ~50% |
| Mediocre (-1) vs Élite (+4), dif. -5 | ~15-20% | ~80-85% |

Referencia FM: "Messi marca 75 de cada 100 oportunidades" (Finishing 20, ~75%). Nuestro sistema da ~80-85% al élite vs mediocre y ~70-75% al élite vs bueno. Dentro del rango FM.

---

# Distribución de peso de cada componente

| Componente | Rango | Swing máx. | Peso teórico |
| --- | --- | --- | --- |
| Carta (diferencia mejor vs peor) | 1-8 | 7 | 18.4% |
| Influencia atributo (élite vs pésimo) | -4 a +4 | 8 | 21.1% |
| Mods situacionales (con rend. decrec.) | -4 a +4 | 8 | 21.1% |
| Carril (acierto/fallo) | -1 a +2 | 3 | 7.9% |
| Incertidumbre (azar) | -6 a +6 | 12 | 31.6% |
| **Total** |  | **38** | **100%** |

## Media ponderada en duelos reales

| Factor | Peso medio |
| --- | --- |
| Cartas | ~16% |
| Atributos | ~23% |
| Mods situacionales | ~14% |
| Carril (mind-game) | ~15% |
| Azar | ~33% |

Tres tercios casi perfectos: **decisión** del jugador humano (cartas + carril = 31%), **preparación** del equipo (atributos + mods = 37%), y **drama/incertidumbre** (33%).

## Por qué este equilibrio funciona

- Ningún factor domina por encima del 33%
- Las decisiones del jugador humano (31%) pesan casi tanto como el azar (33%)
- Los atributos importan (~23%) pero no aplastan: un underdog con buenas cartas y buena lectura de carril puede ganar
- Las cartas ganan importancia (~16%): la carta correcta en el momento correcto puede compensar desventaja de atributos
- El azar (33%) está modulado por Composure, banda dinámica y técnicas especiales: no es lotería pura

---

# Información visible para el jugador

**Siempre visible:** tus cartas en mano, tus jugadores y su influencia de atributo, tu momentum, tu energía, jugadas restantes, eslabón actual (y presión acumulada).

**Visible pero aproximado:** amenaza del defensor rival (barra: baja, media, alta, extrema). No ves el número exacto ni qué carta jugará. El rasgo "Estudio del rival" podría dar información más precisa.

**Oculto:** la apuesta de carril del defensor, el factor de incertidumbre, si el rival jugará técnica especial.