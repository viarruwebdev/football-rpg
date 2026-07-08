# language: es
# Criterios de aceptación de la feature 002-remate-portero.
# Solo escenarios verdaderos por construcción de las reglas del §6 (tabla de remate).
# La calibración estadística de tasa de gol se valida en tools/sim, no aquí.
# Reutiliza el motor de 001 (compresión, mods, incertidumbre, Rng): esos invariantes
# ya están cubiertos en 001-resolvedor-duelos.feature y no se reescriben aquí.

Característica: Resolución de un remate contra el portero
  Para que rematar tenga tensión y consecuencias reproducibles
  Como desarrollador del motor
  Quiero que el remate use su propia tabla de umbrales y los mods de disparo, sin carril

  Antecedentes:
    Dado el resolvedor de remate del núcleo

  Escenario: el resultado es reproducible con la misma semilla
    Dado un remate cualquiera con la semilla 42
    Cuando lo resuelvo dos veces
    Entonces obtengo el mismo tramo de resultado y los mismos eventos ambas veces

  Esquema del escenario: cada resultado cae en exactamente un tramo de la tabla de remate
    Dado un Resultado numérico de <resultado>
    Cuando clasifico el desenlace del remate
    Entonces el tramo es "<tramo>"

    Ejemplos:
      | resultado | tramo                 |
      | 6         | Gol imparable         |
      | 5         | Gol imparable         |
      | 4         | Gol                   |
      | 3         | Gol                   |
      | 2         | Gol con rebote        |
      | 1         | Gol con rebote        |
      | 0         | Paradón               |
      | -1        | Parada sólida         |
      | -2        | Parada sólida         |
      | -3        | Parada y contragolpe  |
      | -5        | Parada y contragolpe  |

  Escenario: la tabla de remate es asimétrica hacia el gol
    Dado un remate cuyo Resultado es exactamente 0
    Cuando lo resuelvo
    Entonces el tramo es "Paradón" y no hay gol
    Y un remate cuyo Resultado es +1 sí es gol ("Gol con rebote")

  Escenario: en juego abierto el remate no tiene componente de carril
    Dado un remate que no es penalti
    Cuando calculo la fuerza del portero
    Entonces no se aplica ningún efecto de carril a la fuerza del portero
    Y la bandera esPenalti es un no-op en v1 (no altera la resolución)

  Escenario: la asistencia previa aporta +3 de modificador bruto al rematador
    Dado un remate con asistencia previa y sin otros modificadores
    Cuando calculo los modificadores brutos del rematador
    Entonces valen +3

  Escenario: el cabezazo tras centro aporta +2 de modificador bruto
    Dado un remate de cabeza tras un centro, sin otros modificadores
    Cuando calculo los modificadores brutos del rematador
    Entonces valen +2

  Esquema del escenario: el disparo lejano penaliza según zona y Long Shots
    Dado un disparo lejano desde la zona <zona>
    Y un rematador con Long Shots <longShots>
    Cuando calculo el modificador de disparo lejano
    Entonces vale <penalizador>

    Ejemplos:
      | zona   | longShots | penalizador |
      | Ataque | 10        | -3          |
      | Ataque | 16        | -1          |
      | Ataque | 18        | 0           |
      | Medio  | 10        | -5          |

  Escenario: la influencia usa Finishing del rematador y Reflexes del portero
    Cuando calculo la fuerza del rematador con Finishing 18
    Entonces su influencia de atributo es +4
    Y la del portero con Reflexes 9 es -1

  Escenario: un gol emite el evento de momentum pero no lo aplica
    Dado un remate cuyo Resultado es +3 o más
    Cuando lo resuelvo
    Entonces se emite un evento de gol
    Y se emite un evento de momentum "+2 atacante"
    Y el resolvedor no modifica por sí mismo la barra de momentum

  Escenario: un paradón concede córner y momentum al defensor
    Dado un remate cuyo Resultado es exactamente 0
    Cuando lo resuelvo
    Entonces se emite un evento de córner
    Y se emite un evento de momentum "+1 defensor"

  Escenario: el suelo de banda se hereda del motor de 001
    Dado un remate muy igualado con un portero de Composure 20
    Cuando determino la banda de incertidumbre
    Entonces la banda no es inferior a ±3
