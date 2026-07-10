# language: es
# Criterios de aceptación de la feature 004-cadena-posesion.
# Solo escenarios verdaderos por construcción de §2 y §3.
# La calibración estadística (goles/partido, jerarquía con momentum) se valida en tools/sim.
# Reutiliza de 001/002/003: resolveDuel, resolveShot, updateMomentum, degradeAndDetect,
# computeMomentumModifier, applyDiminishing. Sus invariantes ya están cubiertos allí.

Característica: Cadena de posesión y reloj de partido
  Para que los duelos aislados se conviertan en un partido
  Como desarrollador del motor
  Quiero un orquestador determinista que secuencie duelos, gestione el reloj y cablee el momentum

  Antecedentes:
    Dado el orquestador de partido del núcleo

  # --- Determinismo ---

  Escenario: el partido completo es reproducible
    Dado un estado inicial de partido y la semilla 42
    Cuando simulo el partido dos veces
    Entonces obtengo el mismo marcador, el mismo log de eventos y el mismo reloj final

  # --- Reloj ---

  Esquema del escenario: cada acción consume las jugadas de la tabla del §2
    Dado un reloj en la jugada 10
    Cuando ocurre "<accion>"
    Entonces el reloj avanza <jugadas> jugadas

    Ejemplos:
      | accion                      | jugadas |
      | duelo normal                | 1       |
      | remate a portería           | 1       |
      | balón dividido              | 2       |
      | córner                      | 2       |
      | penalti                     | 2       |
      | sustitución                 | 1       |
      | pase de seguridad sin duelo | 1       |
      | posesión estéril            | 2       |

  Escenario: robar cartas y efectos pasivos no consumen reloj
    Dado un reloj en la jugada 10
    Cuando el equipo roba cartas al iniciar posesión
    Y se aplica un efecto pasivo de momentum
    Entonces el reloj sigue en la jugada 10

  Escenario: el descuento se deriva de los eventos, no del azar al revelarlo
    Dado un partido con 4 faltas, 1 lesión y 2 cambios
    Cuando calculo el descuento
    Entonces vale la base más 2 (4×0.5) más 1 (lesión) más 1 (2×0.5)
    Y el mismo cálculo con la misma semilla da el mismo valor exacto

  Escenario: el descuento es semioculto hasta las últimas 2 jugadas
    Dado un partido en el descuento con más de 2 jugadas restantes
    Cuando consulto el descuento visible
    Entonces obtengo un rango estimado, no el valor exacto
    Pero cuando quedan 2 jugadas
    Entonces obtengo el valor exacto
    Y el valor exacto no ha cambiado desde el inicio del partido

  Escenario: el reloj no se pausa al robar el balón
    Dado un reloj en la jugada 20 y una posesión del equipo A
    Cuando el equipo B roba el balón
    Entonces el reloj sigue en la jugada 20
    Y la nueva posesión de B consume del mismo reloj compartido

  # --- Posesión y presión ---

  Esquema del escenario: la presión acumulada sube +1 por eslabón consecutivo
    Dada una posesión en su eslabón número <eslabon>
    Cuando calculo la presión acumulada del defensor
    Entonces vale <presion>

    Ejemplos:
      | eslabon | presion |
      | 1       | 0       |
      | 2       | 1       |
      | 3       | 2       |
      | 4       | 3       |

  Escenario: la presión acumulada entra como modificador, no íntegra
    Dada una posesión en su cuarto eslabón (presión +3)
    Cuando el orquestador construye los mods para resolveDuel
    Entonces la presión +3 está en el array de mods brutos
    Y pasa por applyDiminishing junto al resto de modificadores

  Escenario: el robo resetea la presión acumulada
    Dada una posesión del equipo A en su cuarto eslabón (presión +3)
    Cuando el equipo B roba el balón
    Entonces la presión acumulada de la nueva posesión es 0

  # --- Cableado del momentum ---

  Escenario: el modificador de momentum entra en los mods del duelo
    Dado un equipo con momentum +5
    Cuando el orquestador construye los mods para resolveDuel
    Entonces el array de mods brutos incluye +0.75 (clamp de 0.15 × 5)
    Y ese valor pasa por applyDiminishing con el resto

  Escenario: el momentum no se aplica íntegro
    Dado un equipo con momentum +5 y otros modificadores que suman +8 bruto
    Cuando calculo los mods efectivos
    Entonces el total bruto es 8.75
    Y el efectivo es menor que 8.75 por los rendimientos decrecientes

  Escenario: tras cada duelo se traduce el segmento a momentum
    Dado un duelo resuelto con segmento "éxito limpio"
    Cuando el orquestador procesa el resultado
    Entonces llama a applyDuelResult con ese segmento
    Y no construye el delta de momentum a mano

  Escenario: los eventos de remate van por applyEvent
    Dado un remate resuelto en gol
    Cuando el orquestador procesa el resultado
    Entonces llama a applyEvent con la causa "goal"
    Y no usa applyDuelResult para el remate

  # --- Causas que solo el orquestador conoce ---

  Escenario: la racha de posesión se emite al alcanzar 3 duelos ganados
    Dada una posesión con 2 duelos ganados
    Cuando el equipo gana el tercer duelo de la misma posesión
    Entonces se emite la causa de momentum "possessionStreak"

  Escenario: la racha de posesión no se re-emite en el cuarto duelo
    Dada una posesión con 3 duelos ganados y possessionStreak ya emitido
    Cuando el equipo gana el cuarto duelo de la misma posesión
    Entonces no se vuelve a emitir "possessionStreak"
    Pero sí se aplica el +0.5 del duelo ganado por la tabla de duelos

  # Las franjas se nombran desde la perspectiva del ATACANTE.
  # Zona avanzada del que roba = franjas bajas del que ataca.

  Escenario: el robo en campo contrario emite pressingSteal (pressing alto)
    Dada una posesión del equipo A en la franja de Defensa de A
    Cuando el equipo B roba el balón en esa franja
    Entonces se emite la causa de momentum "pressingSteal" para B

  Escenario: el robo en el propio área no emite pressingSteal
    Dada una posesión del equipo A en la franja de Área
    Cuando el equipo B roba el balón en esa franja
    Entonces no se emite "pressingSteal"
    Porque B está defendiendo su portería, no presionando arriba

  # --- Degradación por posesión ---

  Escenario: el momentum positivo degrada si la posesión no tuvo evento ni duelo ganado
    Dado un equipo con momentum +3
    Y una posesión suya sin evento significativo ni duelo ganado
    Cuando se cierra la posesión
    Entonces su momentum baja a +2

  Escenario: el momentum positivo no degrada si ganó un duelo
    Dado un equipo con momentum +3
    Y una posesión suya con al menos un duelo ganado
    Cuando se cierra la posesión
    Entonces su momentum no baja por degradación

  Escenario: el momentum negativo degrada en cada posesión
    Dado un equipo con momentum -3
    Cuando se cierra cualquier posesión, con o sin evento
    Entonces su momentum sube a -2

  Escenario: el contador de consecutivos se resetea al terminar la posesión
    Dado un equipo con 3 duelos ganados consecutivos en la posesión actual
    Cuando la posesión termina en gol (sin haber perdido ningún duelo)
    Entonces el contador de duelos consecutivos vuelve a 0
    Y la siguiente posesión empieza con el contador a 0

  Escenario: la degradación se aplica a ambos equipos al cerrar posesión
    Dado el equipo A con momentum +2 y el equipo B con momentum -2
    Y una posesión sin eventos para ninguno
    Cuando se cierra la posesión
    Entonces A baja a +1 y B sube a -1

  # --- Fin de partido ---

  Escenario: el reloj a 0 permite completar el duelo en curso
    Dado un reloj a 0 durante una posesión atacante
    Cuando el atacante está a mitad de un duelo
    Entonces el duelo en curso se resuelve
    Y si resulta en remate, el remate se ejecuta

  Escenario: último suspiro para el equipo que va perdiendo
    Dado un reloj a 0 y el equipo atacante va perdiendo
    Cuando el atacante reclama el último suspiro
    Entonces juega exactamente 1 duelo extra
    Y si resulta en remate, el remate se ejecuta
    Y no puede jugar un segundo duelo extra

  Escenario: sin último suspiro si el atacante va ganando o empatando
    Dado un reloj a 0 y el equipo atacante va ganando
    Cuando se agota el duelo en curso
    Entonces el partido termina sin duelo extra

  # --- Saque inicial ---

  Escenario: el local saca en la primera parte, el visitante en la segunda
    Dado el inicio de la primera parte
    Entonces la primera posesión es del equipo local
    Y al inicio de la segunda parte, la primera posesión es del visitante
