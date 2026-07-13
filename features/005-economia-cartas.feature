# language: es
# Criterios de aceptación de la feature 005-economia-cartas.
# Solo escenarios verdaderos por construcción de §2, §3 y §4.
# La calibración (agotamiento real, goles/partido) se valida en tools/sim.
# Reutiliza de 001/002/003/004: resolveDuel, resolveShot, applyDiminishing, playMatch.

Característica: Economía de cartas
  Para que gastar una carta sea una decisión con consecuencias
  Como desarrollador del motor
  Quiero sub-mazos que se agotan, una mano compartida, y tres válvulas cuando te quedas seco

  Antecedentes:
    Dado el sistema de economía de cartas del núcleo

  # --- Determinismo y agotamiento ---

  Escenario: el barajado es reproducible
    Dado un sub-mazo y la semilla 42
    Cuando lo barajo dos veces
    Entonces obtengo el mismo orden ambas veces

  Escenario: una carta jugada sale del juego para siempre
    Dado un sub-mazo de ataque con 5 cartas
    Cuando juego una carta de la mano
    Entonces esa carta no está en el sub-mazo
    Y no está en la mano
    Y no reaparece por mucho que siga robando

  Escenario: una carta descartada por exceso vuelve al fondo de su sub-mazo
    Dada una mano de 7 cartas y un robo de 2 ofensivas
    Cuando descarto 2 cartas para volver a 7
    Entonces las descartadas están en el fondo de sus sub-mazos correspondientes
    Y no en una pila de descartes

  Escenario: los sub-mazos nunca se rebarajan
    Dado un sub-mazo de ataque vacío
    Cuando intento robar de él
    Entonces no roba ninguna carta
    Y el sub-mazo sigue vacío
    Y no se reconstruye con las cartas jugadas

  Escenario: robar de un sub-mazo agotado no falla
    Dado un sub-mazo de defensa con 0 cartas
    Cuando el equipo pasa a defender y le toca robar 1 defensiva
    Entonces no roba ninguna carta
    Y la operación no lanza error

  # --- Mano ---

  Escenario: la mano inicial es 5 ofensivas y 2 defensivas
    Dado el inicio del partido
    Cuando reparto la mano inicial
    Entonces la mano tiene 7 cartas
    Y 5 son del sub-mazo de ataque y 2 del de defensa

  Escenario: la mano nunca supera 7 cartas
    Dada una mano de 6 cartas
    Cuando robo 3 cartas
    Entonces debo descartar hasta volver a 7
    Y la mano tiene exactamente 7 cartas

  Escenario: la mano es única y compartida entre fases
    Dada una mano con cartas ofensivas y defensivas
    Cuando cambio de atacar a defender
    Entonces sigo teniendo la misma mano
    Y las cartas ofensivas siguen en ella

  # --- Robo asimétrico ---

  Escenario: al cambiar de posesión ambos equipos roban a la vez
    Dado que el equipo B roba el balón al equipo A
    Cuando se inicia la nueva posesión
    Entonces B roba 2 cartas de ataque y 1 compartida
    Y A roba 1 carta de defensa y 1 compartida

  Escenario: el defensor roba 1 defensiva, no 2
    Dado un equipo que pasa a defender
    Cuando le toca robar
    Entonces roba exactamente 1 carta del sub-mazo de defensa
    Porque el mazo defensivo tiene 10-12 cartas y el ofensivo 18-20

  # --- Mulligan ---

  Escenario: el mulligan cambia cartas sin cambiar el tamaño de la mano
    Dada una mano de 7 cartas al inicio de mi posesión
    Cuando hago mulligan descartando 2
    Entonces robo 2 del sub-mazo de la fase actual
    Y la mano sigue teniendo 7 cartas
    Y las 2 descartadas están en el fondo de su sub-mazo

  Escenario: el mulligan es como máximo uno por posesión
    Dado que ya hice mulligan en esta posesión
    Cuando intento hacer otro
    Entonces no se permite

  Escenario: el mulligan roba lo que haya si el sub-mazo está corto
    Dado un sub-mazo de ataque con 1 carta
    Cuando hago mulligan descartando 2
    Entonces robo solo 1 carta
    Y la mano tiene 6 cartas

  # --- Portero ---

  Escenario: el set del portero se regenera cada posesión defensiva
    Dado un portero que usó Estirada en la posesión anterior
    Cuando empieza una nueva posesión defensiva de su equipo
    Entonces Estirada vuelve a estar disponible

  Esquema del escenario: las cartas superiores se desbloquean por umbral de atributo
    Dado un portero con <atributo> de valor <valor>
    Cuando construyo su set
    Entonces la carta "<carta>" <disponible> en el set

    Ejemplos:
      | atributo      | valor | carta             | disponible |
      | Handling      | 13    | Blocaje           | está       |
      | Handling      | 12    | Blocaje           | no está    |
      | Aerial Reach  | 15    | Despeje de puños  | está       |
      | Reflexes      | 15    | Estirada          | está       |
      | Reflexes      | 14    | Estirada          | no está    |
      | One on Ones   | 17    | Achique           | está       |
      | One on Ones   | 16    | Achique           | no está    |

  Escenario: Parada básica es ilimitada
    Dado un portero que ya usó Parada básica en esta posesión
    Cuando afronta un segundo remate
    Entonces puede volver a jugar Parada básica

  Escenario: una carta superior solo se usa una vez por posesión
    Dado un portero que usó Estirada en esta posesión
    Cuando afronta un segundo remate tras un rebote
    Entonces Estirada no está disponible
    Y solo le queda Parada básica (u otras superiores sin usar)

  Escenario: el portero no roba cartas de ningún mazo
    Dado el inicio de una posesión defensiva
    Cuando el equipo roba sus cartas
    Entonces el set del portero no consume cartas de ningún sub-mazo

  # --- Jugar sin carta de la fase ---

  Escenario: improvisar da potencia 0 y no gasta carta
    Dado un atacante sin cartas ofensivas en la mano
    Cuando improvisa desde la franja de Medio
    Entonces la potencia de la acción es 0
    Y usa el atributo Passing del jugador
    Y no gasta ninguna carta de la mano

  Escenario: improvisar no salva a los malos
    Dado un delantero con Finishing 18 (influencia +4) improvisando en el Área
    Entonces su Fuerza es 4
    Y un delantero con Finishing 9 (influencia -1) improvisando tiene Fuerza -1

  Esquema del escenario: reconvertir da la mitad de potencia, redondeada abajo
    Dada una carta de potencia <potencia> de la otra fase
    Cuando la reconvierto
    Entonces su potencia efectiva es <efectiva>

    Ejemplos:
      | potencia | efectiva |
      | 2        | 1        |
      | 3        | 1        |
      | 4        | 2        |
      | 5        | 2        |

  Escenario: una carta reconvertida usa el atributo natural de la fase actual
    Dada una Barrida (potencia 4, atributo Tackling) en la mano
    Cuando la reconvierto como acción ofensiva desde el Medio
    Entonces su potencia efectiva es 2
    Y suma el Passing del jugador, no su Tackling

  Escenario: no se puede reconvertir una carta de potencia 1
    Dada una carta de potencia 1 de la otra fase
    Cuando intento reconvertirla
    Entonces la operación falla ruidosamente
    Porque valdría potencia 0, idéntico a improvisar pero gastando carta

  # --- Instantes ---

  Escenario: un instante es adicional a la carta de acción
    Dado un duelo en fase pre-revelado
    Cuando juego un instante
    Entonces sigo jugando también mi carta de acción
    Y el instante no consume jugada del reloj

  Escenario: máximo un instante por duelo y por jugador
    Dado que ya jugué un instante en este duelo
    Cuando intento jugar un segundo
    Entonces no se permite
    Pero el defensor sí puede jugar el suyo

  Escenario: los instantes que suman potencia no se apilan sobre técnicas especiales
    Dada una técnica especial jugada como carta de acción
    Cuando intento jugar un instante que suma potencia
    Entonces el bonus no se aplica

  # --- Repliegue ---

  Escenario: el repliegue cuesta una carta y da +2 a la defensa base
    Dada una mano con al menos 1 carta antes de la posesión rival
    Cuando repliego
    Entonces gasto 1 carta de la mano
    Y la fuerza defensiva base sube +2 durante toda esa posesión rival

  Escenario: el repliegue entra como modificador, no íntegro
    Dado un repliegue activo (+2)
    Cuando el orquestador construye los mods para resolveDuel
    Entonces el +2 está en el array de mods brutos
    Y pasa por applyDiminishing junto al resto

  Escenario: máximo un repliegue por posesión rival
    Dado que ya repleguté en esta posesión rival
    Cuando intento replegar de nuevo
    Entonces no se permite

  Escenario: no se puede replegar con la mano vacía
    Dada una mano de 0 cartas
    Cuando intento replegar
    Entonces no se permite

  # --- Integración con la 004 ---

  Escenario: el éxito aplastante roba una carta
    Dado un duelo resuelto en éxito aplastante (+6)
    Cuando el orquestador aplica la transición
    Entonces el atacante roba 1 carta de su sub-mazo de ataque
    Y el test de no-implementación de la 004 ya no aplica

  Escenario: playMatch usa la carta real de la mano, no un stub
    Dado un duelo en un partido completo
    Cuando el orquestador resuelve el duelo
    Entonces la carta que pasa a resolveDuel viene de la mano del equipo
    Y esa carta sale de la mano tras jugarse
