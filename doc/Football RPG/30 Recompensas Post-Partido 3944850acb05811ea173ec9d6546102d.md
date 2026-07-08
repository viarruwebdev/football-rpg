# 30. Recompensas Post-Partido

# Principio

Tras cada victoria (todos los partidos tienen ganador, no hay empates), el jugador elige **1 recompensa entre 3** generadas proceduralmente de categorías distintas. Es el cofre del roguelite: riesgo (partido) → recompensa (elección). El micro-bucle que engancha.

---

# Mecánica de elección

Se eligen 3 de las 6 categorías al azar. Dentro de cada categoría se elige 1 recompensa al azar. El jugador ve las 3 opciones, elige 1, las otras 2 desaparecen. Menos de 10-30 segundos por decisión.

---

# Categoría 1: Desarrollo

- "+3 CA a un jugador menor de 23 de tu elección"
- "+1 PA permanente a un jugador que jugó el partido"
- "Un atributo específico de un jugador sube +1 permanente (tú eliges jugador y atributo)"
- "Desbloquea foco de entrenamiento adicional para 1 jugador durante 5 partidos (doble velocidad)"
- "Un canterano de tu cantera gana +5 CA inmediato"
- "Un jugador que marcó gol gana +2 CA inmediato en Finishing"
- "Un jugador que dio asistencia gana +1 permanente en Passing o Vision (tú eliges)"
- "Un jugador veterano (28+) gana +1 permanente en un atributo mental a elegir"
- "Ralentiza el declive de 1 veterano: sus físicos no bajan durante 5 partidos"
- "Un jugador con PA no alcanzado gana +5% velocidad de desarrollo durante 10 partidos"

---

# Categoría 2: Química y moral

- "+10 química entre 2 jugadores que participaron en el partido"
- "Toda la plantilla sube 1 escalón de moral"
- "+5 química media grupal"
- "Un jugador con indicador 'Dudoso' o peor en retención pasa a 'Cómodo'"
- "Un jugador gana rasgo 'Comprometido' temporal (no rechaza retención esta temporada)"
- "Un conflicto activo entre 2 jugadores se reduce en gravedad (-10 tensión)"
- "+15 química entre un canterano promovido y un veterano de tu elección"
- "El capitán gana +1 Leadership temporal durante 3 partidos"
- "Un jugador con moral Bajo sube directamente a Alto (salto de 2 escalones)"
- "Dos jugadores que participaron en una jugada de gol ganan +8 química entre ellos"

---

# Categoría 3: Recursos tácticos

- "Roba 1 carta táctica extra para tu mazo durante los próximos 3 partidos"
- "Tu energía inicial sube +2 en el próximo partido"
- "Elimina la fatiga de todos los jugadores que participaron"
- "En el próximo partido, tu portero empieza con 1 carta especial extra en su set"
- "En el próximo partido, tu mano inicial es de 8 cartas en vez de 7"
- "En el próximo partido, tu sub-mazo ofensivo gana 2 cartas genéricas de potencia 3 extra"
- "En el próximo partido, la presión defensiva acumulada del rival empieza en +1 (tu defensa sale preparada)"
- "Desbloquea 1 técnica especial temporal para un jugador durante 3 partidos (genera una técnica aleatoria compatible con sus atributos)"
- "En el próximo partido, el descuento es de 6-10 jugadas garantizado (más tiempo)"
- "En el próximo partido, empiezas con +1 momentum"

---

# Categoría 4: Scouting e información

- "Tu ojeador gana 1 informe extra esta temporada (no consume de su pool)"
- "Se revela el PA real de 1 jugador de tu plantilla (no estimado)"
- "Se adelanta 1 nivel de información sobre tu próximo rival"
- "Se revela 1 rasgo oculto de un jugador de tu plantilla"
- "Se revela el jugador clave de 1 franquicia rival a tu elección"
- "Se revela el perfil de personalidad de 1 franquicia rival (normalmente oculto)"
- "Tu ojeador re-evalúa a 1 canterano con precisión máxima (±5 PA en vez del margen normal)"
- "Se revelan los 3 mejores jugadores de la próxima bolsa del draft (anticipo)"
- "Se revela si tu próximo rival va a usar su estilo habitual o piensa cambiarlo"
- "Se revela la lista de jugadores que tu próximo rival planea descartar en retención (info para trades)"

---

# Categoría 5: Consumibles

- "Ganas 1 ficha de ojeo (revela PA real de 1 jugador del draft)"
- "Ganas 1 impulso de desarrollo (+5 CA a un jugador)"
- "Ganas 1 comodín táctico (cambio de estilo sin penalización por 1 partido)"
- "Ganas 1 blindaje de retención (1 jugador acepta retención garantizado)"
- "Ganas 1 convocatoria estrella (jugador temporal PA 150+ durante 3 partidos)"
- "Ganas 1 consumible misterioso (60% cualquiera de los anteriores, 40% consumible único especial)"
- "Ganas 1 escudo anti-cicatriz (anula la próxima cicatriz que recibirías)"
- "Ganas 1 ficha de retención doble (puedes retener 16 jugadores en vez de 15 esta temporada)"

---

# Categoría 6: Cantera y staff

- "Tu cantera genera 1 canterano extra esta temporada (bonus a la hornada)"
- "Un canterano de tu elección gana +1 rasgo positivo de desarrollo aleatorio"
- "Tu director de cantera mejora +½ estrella temporal durante 1 temporada"
- "Tu preparador físico mejora +½ estrella temporal durante 3 partidos"
- "Tu asistente mejora +½ estrella temporal durante 5 partidos"
- "Tu ojeador mejora +½ estrella temporal para el próximo draft"
- "Un canterano aleatorio sube de ★★ a ★★★ en estimación (su PA real puede ser incluso mayor)"
- "Las instalaciones de cantera producen como si fueran 1 nivel superior durante la próxima hornada"

---

# Escalado por dificultad del partido

| Contexto de victoria | Efecto en las opciones |
| --- | --- |
| Victoria contra equipo inferior | Recompensas normales |
| Victoria contra equipo de tu nivel | 20% de que 1 opción sea mejorada (números más altos) |
| Victoria en playoff | Las 3 opciones son mejoradas |
| Victoria remontando (ibas perdiendo) | Además de elegir 1 de 3, bonus fijo: +1 moral toda la plantilla |
| Victoria contra la Nemésis | Además de elegir 1 de 3, bonus fijo: +5 Legado extra |
| Victoria en la final de una copa | 1 de 3 mejoradas + se añade 1 opción extra (eliges 1 de 4) |
| Victoria en penaltis | Se añade bonus fijo: +3 química grupal (la euforia de los penaltis) |
| Victoria en la prórroga | Se añade bonus fijo: recuperación total de fatiga de toda la plantilla |

---

# Resumen

| Concepto | Regla |
| --- | --- |
| Cuándo | Tras cada victoria (no hay empates en el juego) |
| Formato | Elige 1 de 3 opciones de categorías distintas |
| Categorías | 6: Desarrollo, Química/moral, Tácticos, Scouting, Consumibles, Cantera/staff |
| Generación | 3 categorías al azar, 1 recompensa por categoría |
| Escalado | Victorias difíciles / playoff / remontada / némesis → opciones mejoradas |
| Tiempo de decisión | <10-30 segundos |