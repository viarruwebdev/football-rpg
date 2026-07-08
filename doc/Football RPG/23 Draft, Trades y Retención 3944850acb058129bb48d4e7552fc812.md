# 23. Draft, Trades y Retención

# Ciclo de fin de temporada

## Paso 1: Retención (elegir 15)

Al finalizar la temporada, eliges **15 jugadores** que quieres retener de tu plantilla de 23. Los 8 restantes son descartados.

**Los jugadores tienen la última palabra.** De tus 15 elegidos, cada uno decide si quiere quedarse o no. La probabilidad de que acepten depende de:

- **Moral:** jugadores con moral Alta o Eufórica casi siempre aceptan. Jugadores Hundidos o Bajos pueden rechazar.
- **Rasgos:** "Ídolo local" siempre acepta. "Mercenario" o "Diva" pueden rechazar si el equipo no rindió bien. "Modesto" casi siempre acepta.
- **Resultados del equipo:** si el equipo estuvo en zona de relegación, más jugadores quieren irse. Si ganó un título, casi todos se quedan.
- **Química:** jugadores con alta química media con el resto de retenidos tienen más probabilidad de quedarse (les gusta el grupo).

Los jugadores que rechazan tu oferta de retención van a la bolsa del draft.

### Indicadores de intención (visibles desde mitad de temporada)

A partir de la mitad de la temporada, cada jugador muestra un indicador de intención:

- **Comprometido** — Quiere quedarse (~5% rechazo)
- **Cómodo** — Bien pero no entusiasmado (~15% rechazo)
- **Dudoso** — Podría irse (~40% rechazo)
- **Con un pie fuera** — Probablemente se va (~70% rechazo)
- **Quiere irse** — Casi seguro que rechaza (~90% rechazo)

El indicador depende de moral, rasgos, resultados y química. El jugador humano VE las señales con meses de antelación y puede actuar: darle más minutos, charla individual, capitanía, concentración. La retención es un mini-juego durante la segunda mitad de la temporada, no una sorpresa al final.

### Coste del rechazo para el jugador

Rechazar la retención tiene consecuencias para el jugador que se va:

- Pierde todo su historial de canterano (ya no cuenta como canterano de ningún club)
- Pierde rasgo "Ídolo local" automáticamente si lo tenía
- Pierde TODA la química acumulada: entra al draft con química 0 con todos
- Su PA puede bajar ligeramente (-2 a -5 por inestabilidad)
- Está marcado como "rechazó retención" en el draft (baja su atractivo para la IA)

Esto frena los rechazos masivos: solo los verdaderamente descontentos (moral Hundido, rasgos "Mercenario" o "Diva" extremo) aceptarán el coste. En un año horrible: 3-4 rechazos. En un año normal: 0-1. En un año bueno: nadie.

## Paso 2: Promoción de canteranos

Cuando un canterano cumple 18, decisión obligatoria. Para promoverlo al primer equipo:

- Si hay un **hueco en la plantilla** (por lesión que retira, penalización de canteranos, etc.): el canterano ocupa el hueco directamente
- Si la plantilla está completa (23/23): debes **sustituir a un jugador existente** que va a parar a la bolsa del draft. El canterano ocupa su plaza

El canterano promovido **cuenta en los 15 de retención** al final de temporada. Promover es una inversión de slot: ganas un joven con potencial pero gastas un puesto. La fecha la marca el cumpleaños del canterano (no puedes elegir cuándo).

Si decides **no promoverlo**: el canterano va a la bolsa del draft y desaparece de tu cantera.

Deben cumplirse las normas de plantilla: mínimo 4 canteranos en los 23.

## Paso 3: La bolsa del draft

La bolsa contiene:

- Jugadores descartados por todas las franquicias (los 8 no retenidos de cada una)
- Jugadores que rechazaron quedarse en su franquicia
- Canteranos no promovidos de todas las franquicias
- **Jugadores jóvenes nuevos** generados proceduralmente (talento fresco que entra a la liga, como los college players en la NBA)

## Paso 4: Pre-draft (intercambios/trades)

Antes del draft, las franquicias pueden negociar **intercambios directos:**

- Jugador por jugador (de los retenidos)
- Jugador por ronda de draft (cambias un jugador retenido por una mejor posición en el draft)
- Ronda de draft por ronda de draft

La negociación es simplificada: la IA propone trades y tú aceptas o rechazas. Tú también puedes proponer trades a la IA. No hay regateo: la IA evalúa si el trade es justo y acepta o rechaza.

Los intercambios que incluyen rondas de draft son la decisión más roguelite: ¿cambio mi pick de primera ronda por un jugador seguro, o me arriesgo al draft?

## Paso 5: Lottery pick (sistema NBA 2026 adaptado, anti-tanking)

El orden del draft se determina por **lottery pick** adaptando el sistema NBA 2026 pero con el orden invertido dentro de Copa Bronce (el mejor clasificado tiene más probabilidades, no el peor).

### Orden de prioridad para la lotería

| Posición draft | Equipo | Odds pick #1 |
| --- | --- | --- |
| 1 | Campeón Copa Bronce | 14% |
| 2 | Finalista Copa Bronce | 14% |
| 3 | Semifinalista Copa Bronce | 14% |
| 4 | Semifinalista Copa Bronce | 11.5% |
| 5 | Cuartos Copa Bronce | 11.5% |
| 6 | Cuartos Copa Bronce | 8% |
| 7 | 7º Copa Bronce | 6.8% |
| 8 | 8º Copa Bronce | 6.7% |
| 9 | Campeón Copa Plata | 4.5% |
| 10 | Finalista Copa Plata | 3% |
| 11 | Semifinalista Copa Plata | 1.5% |
| 12 | Semifinalista Copa Plata | 1% |
| 13 | Cuartos Copa Plata | 0.5% |
| 14 | Cuartos Copa Plata | 0.5% |
| 15-16 | 7º-8º Copa Plata | ~0.25% |
| 17-24 | Copa Oro (campeón a 8º) | ~0.1% |
| 25-32 | Championship (8º a campeón) | ~0.05% |

El campeón de liga elige siempre en la posición #32 (último).

### Mecánica del sorteo

Igual que NBA 2026: se sortean los **picks 1 al 4** mediante lotería de bolas con las probabilidades de la tabla. Del **pick 5 en adelante**, se asignan en orden fijo según la clasificación (saltando a los equipos que ya fueron sorteados en los 4 primeros).

Esto significa que cualquier equipo puede teóricamente obtener un pick 1-4 (como Dallas en 2025 con 1.8% de odds), pero los equipos de Copa Bronce que mejor quedaron tienen muchísimas más probabilidades.

### Anti-tanking

**El sistema premia ganar, no perder.** Los Wolves que ganan Copa Bronce tienen 14% de odds para el #1. Los Foxes que quedan últimos en Copa Bronce tienen 6.7%. Perder a propósito te da PEOR pick, no mejor.

Combinado con el **sistema de reputación** (franquicias peor clasificadas tienen más dificultad para retener jugadores y los drafteados empiezan con moral más baja), no hay ningún incentivo para tankear.

## Paso 6: El draft

Cada franquicia elige jugadores de la bolsa por turnos según el orden del lottery pick hasta completar la plantilla de 23.

**Información durante el draft:** para cada jugador de la bolsa, ves la información que tu ojeador te da (según su nivel de estrellas). Con un ojeador malo, eliges casi a ciegas. Con uno bueno, ves atributos, rasgos y estimación de PA con precisión. **El ojeador es la carta más importante del draft.**

**Rondas del draft:** con 32 franquicias y ~8 huecos por plantilla que rellenar, el draft tiene múltiples rondas. En cada ronda, cada franquicia elige 1 jugador. Las rondas continúan hasta que todas las franquicias tienen 23 jugadores.

**Restricciones:** debes cumplir las normas de plantilla al finalizar el draft (3 porteros, 4 canteranos). Si te faltan canteranos, debes elegirlos del pool antes de poder elegir jugadores senior.

**Jugadores no elegidos:** los jugadores que quedan en la bolsa del draft tras completarse todas las rondas **desaparecen del juego permanentemente.** No pasan al siguiente draft, no aparecen en otras franquicias. Se van. Esto añade tensión al draft: si un jugador que te interesa no lo eliges ahora, lo pierdes para siempre. No hay "ya lo pillaré después".

## Picks misteriosos

En cada draft, además de los jugadores visibles, hay **2-3 "picks misteriosos"**: jugadores con TODOS los atributos ocultos. Solo ves un rango amplio de estrellas (★★-★★★★) y su posición.

Draftear un pick misterioso es una apuesta pura: puede ser una joya (PA 170+ con rasgos brillantes) o un desastre (PA 80 con "Cristal" y "Perezoso"). Tu ojeador NO puede investigar picks misteriosos (son inmunes a informes).

Probabilidades: ~40% bueno a excelente, ~35% mediocre, ~25% malo a desastroso. El cofre misterioso del roguelite.

## Normas de plantilla

| Requisito | Regla |
| --- | --- |
| Tamaño de plantilla | 23 jugadores exactos |
| Porteros | Mínimo 3 |
| Canteranos (formados en el club) | Mínimo 4 |
| Presupuesto | Igual para todas las franquicias |
| Salarios | Todos los jugadores cobran igual |

Un jugador cuenta como "canterano" si ha estado en la cantera del club durante al menos 2 temporadas antes de cumplir 18, o si fue promovido desde la cantera del club. Los jugadores drafteados de otros clubs NO cuentan como canteranos salvo que hayan pasado por tu cantera.

## Penalización por canteranos insuficientes

Si al finalizar el draft no tienes 4 canteranos en la plantilla:

- Cada hueco de canterano no cubierto **se deja vacío**: juegas con 22 (o 21, o 20) jugadores en vez de 23
- Además, por cada hueco de canterano, tu **posición en el draft de la siguiente temporada baja 4 puestos** (si elegías 5º, pasas a elegir 9º por cada hueco)
- Los huecos se arrastran hasta que los cubras promoviendo canteranos de tu cantera

Descuidar la cantera es un error que persigue con plantilla más corta (menos profundidad, más riesgo) y peor draft (más difícil reconstruir). Pero no mata de golpe: puedes recuperarte invirtiendo en cantera.

---

# Tendencias del draft

Cada temporada el pool del draft tiene una **tendencia** generada al azar. Se anuncia antes del draft. 1 tendencia de posición + 1 de perfil, y opcionalmente 1 táctica (~30% de los drafts).

## Tendencias por posición

**"Generación de defensas"** — +40% centrales/laterales, -30% delanteros.

**"Cosecha de goleadores"** — +40% delanteros/extremos, -30% pivotes/centrales.

**"Sequía de porteros"** — Solo 1-2 porteros en todo el pool.

**"Invasión de mediocampistas"** — +50% pivotes/interiores/mediapuntas, -25% defensas y delanteros.

**"Equilibrio perfecto"** — Sin tendencia, distribución normal. Rara (~10%).

## Tendencias por perfil

**"Cantera fértil"** — +40% jóvenes <21 con PA alto, CA baja. -30% jugadores hechos (24-28).

**"Mercado de veteranos"** — +40% jugadores 28+ con CA alta. -30% jóvenes con potencial.

**"La clase de cristal"** — ~60% de los PA altos tienen Injury Proneness 13+. Talento frágil.

**"Personalidades difíciles"** — Los mejores vienen con rasgos negativos (Diva, Tóxico, Mercenario).

**"Draft de especialistas"** — Atributos muy polarizados (Finishing 17 con Passing 5). Pocos equilibrados.

**"Generación de oro"** — Todo el pool +5 PA medio. Más talento pero más competencia.

**"Año de vacas flacas"** — Todo el pool -5 PA medio. Talento escaso.

## Tendencias tácticas (opcional, ~30% de los drafts)

**"Era del regate"** — +40% Dribbling/Flair altos, -25% Tackling altos.

**"Era del músculo"** — +40% Strength/Heading/Stamina altos, -30% Technique/First Touch altos.

**"Era de la velocidad"** — +40% Pace/Acceleration altos, -30% jugadores lentos pero inteligentes.

**"Era del cerebro"** — +40% mentales altos con físicos mediocres, -30% atléticos puros.

## Reglas

- Se anuncian antes del draft para planificar
- El ojeador ★★★★★ da detalles específicos de la tendencia
- Fuerzan adaptación: si tu delantero se fue y el draft es "Generación de defensas", tienes que improvisar