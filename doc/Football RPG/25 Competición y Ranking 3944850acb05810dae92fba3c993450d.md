# 25. Competición y Ranking

# Estructura de la competición

32 franquicias en una liga única. Una temporada se divide en dos fases: el Suizo y los Playoffs de división.

---

# Fase 1: Formato Suizo

32 equipos compiten en rondas de eliminación progresiva con sistema suizo.

## Reglas del suizo

- En cada ronda, se emparejan equipos con récord similar (los de 3-1 juegan contra otros de 3-1, etc.)
- **5 victorias = clasificado.** Los 8 primeros equipos en alcanzar 5 victorias pasan al Championship.
- **5 derrotas = eliminado** de la lucha por el Championship.
- Las rondas continúan hasta que los 32 equipos están clasificados o eliminados.
- El récord final del suizo determina el seeding en las divisiones.

## Clasificación en divisiones tras el suizo

| Posición en el suizo | División |
| --- | --- |
| 1-8 (los que alcanzaron 5 victorias) | **Championship** |
| 9-16 | **Copa Oro** |
| 17-24 | **Copa Plata** |
| 25-32 | **Copa Bronce** |

Todos los equipos compiten en una división: incluso los peores tienen un título por el que luchar (Copa Bronce). Esto da objetivo a todos y evita que los últimos partidos sean irrelevantes.

---

# Fase 2: Playoffs de división (formato LEC Spring 2026)

Dentro de cada división de 8 equipos, los **6 mejores** (según su récord en el suizo) clasifican al playoff. Los 2 peores de cada división quedan fuera del playoff.

## Formato: doble eliminación con lower bracket

**Upper bracket (top 4 del suizo en la división):**

- Semifinal 1: 1º vs 4º
- Semifinal 2: 2º vs 3º
- Los ganadores pasan a la final del upper bracket
- Los perdedores caen al lower bracket

**Lower bracket (5º y 6º del suizo + perdedores del upper):**

- Ronda 1: 5º vs perdedor de semifinal upper (la más baja). 6º vs el otro perdedor.
- Ronda 2: ganadores de ronda 1 se enfrentan
- Semifinal lower: ganador de ronda 2 vs perdedor de la final del upper bracket
- El ganador del lower bracket va a la Gran Final

**Gran Final:**

- Ganador del upper bracket vs ganador del lower bracket
- El ganador del upper tiene ventaja: si pierde, hay un segundo partido decisivo (tiene una "vida" extra por no haber perdido nunca)

## Penalización del lower bracket

En el lower bracket, todos tus jugadores tienen **-0.5 de influencia** (la penalización psicológica de haber perdido). El lower bracket sigue existiendo como segunda oportunidad pero no es cómoda: juegas en desventaja. Ganar desde el lower bracket es una hazaña, no una rutina.

## Títulos

Cada división tiene su campeón. Hay 4 títulos por temporada:

- **Campeón de la liga** (ganador del Championship)
- **Campeón Copa Oro**
- **Campeón Copa Plata**
- **Campeón Copa Bronce**

Ganar cualquier título suma puntos al ranking global de franquicias (el Championship suma más que Copa Bronce).

---

# Ranking global de franquicias

Cada franquicia acumula puntos según sus resultados a lo largo de las temporadas.

## Puntos por resultado

| Resultado | Puntos |
| --- | --- |
| Campeón de la liga | +25 |
| Finalista Championship | +18 |
| Semifinalista Championship | +12 |
| Clasificado Championship (top 8 suizo) | +8 |
| Campeón Copa Oro | +10 |
| Campeón Copa Plata | +6 |
| Campeón Copa Bronce | +3 |
| Participar sin título | +1 |

Los puntos se acumulan temporada a temporada. El ranking global refleja el rendimiento histórico.

---

# Relegación cada temporada

**Cada temporada, los 6 equipos de Copa Bronce que NO llegaron a la final son relegados.** Los 2 finalistas sobreviven. 6 franquicias nuevas entran a la liga.

- Si tu franquicia está entre los 6 peores sin llegar a la final de Copa Bronce: **fin de la run (permadeath)**
- Las nuevas franquicias son **completamente nuevas**: plantilla generada desde cero, staff nuevo, sin herencia
- Los jugadores de franquicias disueltas van al pool del draft disponibles para CUALQUIER franquicia
- **Ventaja informativa:** el ojeador de la nueva franquicia tiene **capacidad doble de informes** en su primer draft (evaluar todo el talento disponible es prioritario). Además, los jugadores que pertenecían a la franquicia disuelta local aparecen como "ya ojeados" (sin gastar informes). No hay prioridad de acceso a ningún jugador, solo mejor información sobre todos
- Tasa de muerte: 18.75% cada temporada (6 de 32)
- La amenaza es constante: no hay "temporadas de gracia"

## Copa Bronce: el survival bracket

Los 8 equipos de Copa Bronce juegan el playoff más tenso del juego. No juegan por un trofeo: juegan por su vida. La final de Copa Bronce es más dramática que el Championship porque perder = muerte.

| Posición | Resultado |
| --- | --- |
| Championship (8) | Seguros |
| Copa Oro (8) | Seguros |
| Copa Plata (8) | Seguros |
| Copa Bronce finalistas (2) | Seguros + mejores picks draft |
| Copa Bronce no finalistas (6) | RELEGADOS |

---

# Ranking global (fusión de Ranking + Reputación)

El ranking global es el ÚNICO indicador de prestigio de la franquicia. No existe un sistema de reputación separado. El ranking determina TODO: orden del draft, relegación, y efectos de gestión.

## Cómo se calcula

Puntos acumulados temporada a temporada según resultados (tabla de puntos de la sección anterior).

## Efectos del ranking (antes repartidos entre "ranking" y "reputación")

| Ranking | Efecto competitivo | Efecto en gestión |
| --- | --- | --- |
| 1-8 (top) | Eligen últimos en el draft | Retención fácil (+10% aceptación). Drafteados empiezan con moral Alto. Staff ★★★★★ disponible en el pool. |
| 9-16 | Draft en posición media | Retención normal. Drafteados empiezan con moral Normal. |
| 17-24 | Draft en posición media-alta | Retención algo más difícil (-5% aceptación). Drafteados empiezan con moral Normal. |
| 25-26 (Copa Bronce finalistas) | Mejores odds del pick #1 | Retención difícil (-10% aceptación). Drafteados empiezan con moral Bajo. Staff ★★★★★ rara vez disponible. |
| 27-32 (relegados) | N/A (fin de run) | N/A |

Un solo número que el jugador entiende: "mi posición en la liga determina todo". Sin un segundo sistema opaco de "reputación" que haga cosas parecidas por separado.