# 33. Directrices de Interfaz Roguelite

# Directrices de interfaz roguelite

Estas no son mecánicas nuevas sino decisiones de UI que hacen que el juego se SIENTA como un roguelite.

---

# Presión de muerte visible (punto 4)

El ranking de relegación debe ser **visible constantemente**, no un dato que consultas en un menú. Es una barra o indicador siempre presente que muestra:

- Tu posición actual en el ranking global (ej: "Posición 18/32")
- La línea de relegación (Copa Bronce: posiciones 27-32 relegadas, 25-26 finalistas sobreviven)
- Era actual de la liga

## Tensión visual creciente

| Situación | Feedback visual |
| --- | --- |
| Posición 1-16 (seguro) | Indicador verde, discreto |
| Posición 17-20 (zona media) | Indicador amarillo |
| Posición 21-24 (zona de peligro) | Indicador naranja, pulso lento |
| Posición 25-28 (zona de relegación) | Indicador rojo, pulso rápido |
| Posición 29-32 (muerte inminente) | Indicador rojo intenso, alerta constante |

La relegación ocurre CADA TEMPORADA (6 no-finalistas de Copa Bronce). El indicador es permanentemente relevante, no solo en "años de evaluación".

---

# Panel de recursos visible (punto 6)

Un panel siempre visible (barra lateral o inferior) que muestra de un vistazo tu "estado roguelite":

## Contenido del panel

- **Consumibles guardados** (máximo 3): iconos de cada consumible con tooltip
- **Legado acumulado en la run**: número que crece con cada logro
- **Cicatrices activas**: iconos rojos con nombre y duración restante
- **Ranking global**: posición + barra visual
- **Semilla de liga**: nombre de la semilla activa como recordatorio
- **Condición de arranque**: nombre de la condición activa
- **Era actual**: nombre de la era + temporada actual
- **Pactos activos**: iconos con beneficio y maldición

El panel hace visible lo que ya existe para que se sienta como un roguelite y no como un menú de gestor. El jugador ve de un vistazo qué recursos tiene, qué le perjudica, y cuánto le queda.