# language: es
# Criterios de aceptación de la feature 001-resolvedor-duelos.
# Solo escenarios verdaderos por construcción de las reglas del §6.
# La calibración estadística (élite vs mediocre ~80-85%) se valida en tools/sim, no aquí.

Característica: Resolución de un duelo de eslabón normal
  Para que el partido sea justo y reproducible
  Como desarrollador del motor
  Quiero que el resolvedor de duelos sea determinista y respete la tabla del §6

  Antecedentes:
    Dado el resolvedor de duelos del núcleo

  Escenario: el resultado es reproducible con la misma semilla
    Dado un duelo cualquiera con la semilla 42
    Cuando lo resuelvo dos veces
    Entonces obtengo el mismo tramo de resultado y los mismos eventos ambas veces

  Escenario: la compresión de atributos respeta la tabla
    Cuando calculo la influencia de un atributo de valor 18
    Entonces la influencia es +4
    Y un atributo de valor 11 da influencia 0
    Y un atributo de valor 3 da influencia -4

  Esquema del escenario: el efecto de carril suma un swing de 3 puntos
    Dado un duelo idéntico salvo por la apuesta de carril del defensor
    Cuando el defensor <apuesta> el carril
    Entonces su fuerza efectiva recibe <efecto> por el carril
    Y la diferencia entre acertar y fallar es exactamente 3 puntos

    Ejemplos:
      | apuesta | efecto |
      | acierta | +2     |
      | falla   | -1     |

  Escenario: los modificadores situacionales aplican con rendimientos decrecientes
    Dado un lado con +8 de modificadores situacionales brutos
    Cuando calculo los modificadores efectivos
    Entonces valen +6
    Y la potencia de la carta y la influencia del atributo se aplican íntegras

  Escenario: la banda de incertidumbre nunca baja del suelo mínimo
    Dado un jugador con Composure 20 en un duelo muy igualado
    Cuando determino la banda de incertidumbre
    Entonces la banda no es inferior a ±3

  Escenario: la banda se ensancha con ventaja grande
    Dado una diferencia de fuerza efectiva de 7 o más antes del azar
    Cuando determino la banda de incertidumbre
    Entonces la banda es ±12

  Esquema del escenario: cada resultado cae en exactamente un tramo
    Dado un Resultado numérico de <resultado>
    Cuando clasifico el desenlace
    Entonces el tramo es "<tramo>"

    Ejemplos:
      | resultado | tramo                  |
      | 7         | Éxito aplastante       |
      | 4         | Éxito limpio           |
      | 2         | Avance forzado         |
      | 0         | Balón dividido         |
      | -2        | Pérdida simple         |
      | -4        | Pérdida con desventaja |
      | -6        | Contragolpe devastador |

  Escenario: un éxito aplastante no emite evento de momentum (lo deriva la 003 del tramo)
    Dado un duelo cuyo Resultado es +6 o más
    Cuando lo resuelvo
    Entonces no se emite ningún evento de tipo "momentum"
    Y el resolvedor no modifica por sí mismo la barra de momentum

  Escenario: un balón dividido señala que requiere mini-duelo
    Dado un duelo cuyo Resultado es exactamente 0
    Cuando lo resuelvo
    Entonces el tramo es "Balón dividido"
    Y se emite un evento que indica que se requiere un mini-duelo
    Y el mini-duelo no se resuelve en esta feature
