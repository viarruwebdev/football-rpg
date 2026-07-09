# language: es
# Criterios de aceptación de la feature 003-sistema-momentum.
# Solo escenarios verdaderos por construcción de la §7 unificada.
# Reutiliza de 001/002: el union de eventos (los consume) y applyDiminishing (su salida es un mod).
# Esos invariantes ya están cubiertos en las features previas y no se reescriben aquí.

Característica: Sistema de momentum unificado
  Para que el partido tenga rachas, momentos y drama visible
  Como desarrollador del motor
  Quiero que el momentum se mantenga por equipo, module la fuerza con cap, y dispare efectos visibles por umbrales

  Antecedentes:
    Dado el sistema de momentum del núcleo

  # --- Determinismo ---

  Escenario: la secuencia de eventos y duelos es reproducible
    Dada una secuencia cualquiera de eventos y resultados de duelo
    Cuando la proceso dos veces
    Entonces obtengo la misma barra, el mismo modificador y los mismos efectos de umbral ambas veces

  # --- Tabla de eventos significativos ---

  Esquema del escenario: cada evento significativo aplica su delta
    Dada una barra de momentum en 0 para el equipo
    Cuando consumo un evento significativo con causa "<causa>"
    Entonces la barra del equipo pasa a <delta>

    Ejemplos:
      | causa                              | delta |
      | gol a favor                        | 2     |
      | gol en contra                      | -2    |
      | técnica especial exitosa (+5)      | 1     |
      | parada épica (técnica especial)    | 1     |
      | portero ataja mano a mano          | 1     |
      | robo por pressing zona avanzada    | 1     |
      | racha de posesión (3+ duelos)      | 1     |
      | paradón estándar (resultado 0)     | 1     |

  Escenario: gol contra la marea aplica +3 solo si momentum negativo
    Dada una barra de momentum en -2
    Cuando el equipo marca gol
    Entonces la barra pasa a +1 (inversión +3, no +2 de gol normal)
    Y si la barra hubiera estado en +1 al marcar, habría subido a +3 (+2 de gol normal)

  # --- Tabla de duelos ---

  Esquema del escenario: cada resultado de duelo aplica solo su tramo más específico
    Dada una barra de momentum en 0
    Cuando el resultado del duelo es <resultado>
    Entonces la barra cambia en <delta>

    Ejemplos:
      | resultado                        | delta |
      | éxito aplastante (+6 o más)      | +1    |
      | duelo ganado (consecutivo)       | +0.5  |
      | balón dividido (0)               | 0     |
      | pérdida simple (-1 a -2)         | -1    |
      | pérdida con desventaja (-3 a -5) | -1.5  |
      | contragolpe devastador (-6)      | -2    |

  Escenario: el avance forzado no cuenta como duelo ganado
    Dada una barra de momentum en 0 y un contador de 2 duelos consecutivos
    Cuando el resultado del duelo es avance forzado (+2)
    Entonces la barra no cambia
    Y el contador de duelos consecutivos sigue en 2 (no incrementa)
    Y el contador no se resetea (no es una derrota)

  Escenario: solo perder el duelo resetea el contador de consecutivos
    Dado un contador de duelos consecutivos en 3
    Cuando el resultado del duelo es avance forzado (+1)
    Entonces el contador sigue en 3
    Pero cuando el resultado del duelo es pérdida simple (-1)
    Entonces el contador vuelve a 0

  Escenario: un éxito aplastante da +1, no +1.5
    Dada una barra de momentum en 0 y un contador de 2 duelos consecutivos
    Cuando el equipo gana un duelo por éxito aplastante (+6)
    Entonces la barra sube +1 exactamente (el +1 sustituye al +0.5, no lo suma)
    Y el contador de duelos consecutivos pasa a 3

  Escenario: resolveDuel no emite eventos de momentum
    Dado un duelo de eslabón resuelto en cualquier tramo
    Cuando inspecciono los eventos emitidos por resolveDuel
    Entonces no hay ningún evento de momentum
    Y el momentum se deriva del DuelSegment vía la tabla de duelos

  Escenario: un resultado de 0 no es ambiguo entre tablas
    Dada una barra de momentum en 0
    Cuando el resultado del duelo de eslabón es balón dividido (0)
    Entonces la barra no cambia
    Cuando la barra de momentum vuelve a 0
    Y el resultado del remate es paradón estándar (0)
    Entonces la barra del defensor sube +1
    Y ambos casos usan el mismo número de resultado pero tablas y funciones distintas: applyDuelResult para el duelo de eslabón, applyEvent para el remate

  Escenario: un resultado de -6 aplica solo -2, no la suma de todos los tramos
    Dada una barra de momentum en 0
    Cuando el resultado del duelo es contragolpe devastador (-6)
    Entonces la barra cambia en -2 exactamente
    Y no en -2 + -1.5 + -1 = -4.5

  Escenario: las dos tablas se suman cuando ambas aplican por vías distintas
    Dada una barra de momentum en 0 y un contador de 2 duelos consecutivos
    Cuando el equipo gana el tercer duelo consecutivo de la posesión
    Entonces se suma +0.5 (duelo consecutivo, tabla de duelos) y +1 (racha de posesión, tabla de eventos)
    Y la barra sube +1.5 en total

  Escenario: tercer duelo consecutivo ganado por aplastante suma +2
    Dada una barra de momentum en 0 y un contador de 2 duelos consecutivos
    Cuando el equipo gana el tercer duelo por éxito aplastante (+6)
    Entonces se suma +1 (aplastante, tabla de duelos) y +1 (racha de posesión, tabla de eventos)
    Y la barra sube +2 en total

  # --- Barra fraccional y saturación ---

  Escenario: la barra admite medios puntos
    Dada una barra de momentum en +2.5
    Cuando el equipo gana un duelo consecutivo
    Entonces la barra pasa a +3.0

  Escenario: la barra se satura en +5
    Dada una barra de momentum en +4.5
    Cuando consumo un evento de gol (+2)
    Entonces la barra es +5 y no +6.5

  Escenario: la barra se satura en -5
    Dada una barra de momentum en -4
    Cuando el resultado del duelo es contragolpe devastador (-2)
    Entonces la barra es -5 y no -6

  # --- Cap de Fuerza ---

  Esquema del escenario: el modificador de Fuerza tiene cap duro ±0.75
    Dada una barra de momentum de <momentum>
    Cuando calculo el modificador de Fuerza
    Entonces vale <modificador>

    Ejemplos:
      | momentum | modificador |
      | 0        | 0           |
      | 1        | 0.15        |
      | 2        | 0.30        |
      | 3        | 0.45        |
      | 4        | 0.60        |
      | 5        | 0.75        |
      | -5       | -0.75       |

  Escenario: el modificador entra en el pipeline de mods con rendimientos decrecientes
    Dado un modificador de momentum de +0.75 junto a otros modificadores
    Cuando calculo los mods efectivos con applyDiminishing
    Entonces el momentum participa en los rendimientos decrecientes con el resto

  Escenario: el cap resiste amplificadores
    Dado un pacto que duplica el efecto del momentum
    Y una barra de momentum en +5
    Cuando calculo el modificador de Fuerza
    Entonces sigue siendo +0.75, no +1.50

  # --- Umbrales one-shot ---

  Escenario: cruzar +3 da +1 potencia a la siguiente carta
    Dada una barra de momentum en +2.5
    Cuando la barra sube a +3.0 o más
    Entonces se emite un efecto de umbral "+1 potencia a la siguiente carta (un duelo)"

  Escenario: cruzar +4 roba una carta extra
    Dada una barra de momentum en +3.5
    Cuando la barra sube a +4.0 o más
    Entonces se emite un efecto de umbral "robar 1 carta extra (una vez)"

  Escenario: cruzar +5 activa "en la zona" y desbloquea Jugada perfecta
    Dada una barra de momentum en +4.5
    Cuando la barra sube a +5.0
    Entonces se emite un efecto "en la zona" para un jugador de mi equipo (+1 influencia individual, resto del partido), disparado por mi propio +5
    Y se desbloquea mi carta "Jugada perfecta" (potencia 6, 1 uso)

  Escenario: "en la zona" sobrevive al descenso de la barra
    Dado un jugador "en la zona" activado a momentum +5
    Cuando la barra baja a +2
    Entonces el jugador sigue "en la zona" con su +1 influencia individual

  Escenario: "en la zona" solo se concede una vez por partido por equipo
    Dado que el equipo ya tiene un jugador "en la zona"
    Cuando la barra vuelve a alcanzar +5 tras haber bajado
    Entonces no se concede otro "en la zona"

  Escenario: los umbrales +3 y +4 se re-disparan al cruzar de nuevo
    Dado que el umbral +3 ya se disparó
    Y la barra bajó a +2 y vuelve a subir a +3
    Entonces el efecto de +1 potencia se dispara de nuevo

  # --- ±3 y ±4 son simétricos mecánicos; ±5 NO lo es ---
  # detectThresholdCrossing opera sobre el par de barras del partido
  # (MatchMomentumState) y resuelve rivalTrough sin ayuda de la 004 — estos
  # escenarios son ejercitables de extremo a extremo dentro de la 003.

  Esquema del escenario: los umbrales ±3 y ±4 son simétricos mecánicos
    Dada una barra de momentum en <barra-inicial>
    Cuando la barra cruza <umbral>
    Entonces se emite el efecto de umbral "<efecto>"

    Ejemplos:
      | barra-inicial | umbral | efecto                                |
      | +2.5          | +3.0   | +1 potencia a la siguiente carta      |
      | -2.5          | -3.0   | -1 potencia a la siguiente carta      |
      | +3.5          | +4.0   | robar 1 carta extra                   |
      | -3.5          | -4.0   | robar 1 carta menos                   |

  Escenario: la barra propia cayendo a -5 NO desbloquea Jugada perfecta para nadie
    Dada una barra de momentum en -4.5 para mi equipo
    Cuando mi barra baja a -5.0
    Entonces NO se emite ningún efecto "Jugada perfecta" ni para mi equipo ni para el rival
    Y se emite un efecto "en la zona" a favor del equipo rival, disparado por mi -5 (triggeredBy: rivalTrough)

  Escenario: "en la zona" se gana por el -5 del rival, no por la propia barra
    Dada una barra de momentum en 0 para mi equipo
    Y una barra de momentum en -4.5 para el equipo rival
    Cuando la barra del equipo rival baja a -5.0
    Entonces mi equipo recibe un efecto "en la zona" (triggeredBy: rivalTrough)
    Y mi equipo NO recibe la carta "Jugada perfecta" por este camino

  Escenario: el cupo de "en la zona" es único aunque se dispare por los dos caminos
    Dado que mi equipo ya tiene un jugador "en la zona" concedido por mi propio +5 (triggeredBy: ownPeak)
    Cuando el equipo rival baja a -5 más tarde en el mismo partido
    Entonces mi equipo NO recibe un segundo "en la zona" por el camino rivalTrough
    Y el jugador "en la zona" original de mi equipo no cambia

  # --- Contador de consecutivos ---

  Escenario: perder un duelo resetea el contador de consecutivos
    Dado un contador de duelos consecutivos en 3
    Cuando el equipo pierde un duelo (resultado -1 o peor)
    Entonces el contador vuelve a 0
    Y la barra baja según el tramo más específico de la tabla de duelos

  Escenario: un balón dividido no resetea ni incrementa el contador
    Dado un contador de duelos consecutivos en 2
    Cuando el resultado del duelo es balón dividido (0)
    Entonces el contador sigue en 2
    Y la barra de momentum no cambia

  Escenario: los siete tramos del §6 tienen regla de momentum
    Dado el conjunto de los siete tramos posibles de un duelo de eslabón
    Cuando consulto la tabla de duelos para cada uno
    Entonces todos tienen una regla definida (delta y efecto sobre consecutivos)
    Y ninguno queda sin regla    

  # --- Degradación ---

  Escenario: degradación positiva sin evento ni duelo ganado
    Dado un equipo con momentum +3
    Cuando pasa una posesión sin evento significativo ni duelo ganado
    Entonces el momentum baja a +2

  Escenario: degradación negativa en cada posesión
    Dado un equipo con momentum -3
    Cuando pasa una posesión (con o sin evento)
    Entonces el momentum sube a -2

  Escenario: Determination alta acelera la recomposición
    Dado un equipo con Determination media 16+ y momentum -2
    Cuando pasa una posesión
    Entonces el momentum sube a 0 en vez de -1

  Escenario: la degradación nunca cruza el 0
    Dado un equipo con momentum +0.5
    Cuando pasa una posesión sin evento
    Entonces la barra queda en 0 y no pasa a negativa

  # --- Máximo alcanzado ---

  Escenario: el máximo se registra y no baja
    Dado un equipo cuyo momentum alcanzó +4 y luego bajó a +2
    Cuando consulto el máximo alcanzado
    Entonces es +4

  # --- Contador de jugadas en +5 (RF-010, CE-012) ---

  Escenario: el contador de jugadas en +5 sube solo mientras la barra está exactamente en +5
    Dada una barra de momentum en +5.0
    Cuando la barra se mantiene en +5.0 durante 3 jugadas consecutivas
    Entonces el contador de jugadas en +5 es 3

  Escenario: el contador se detiene al bajar de +5
    Dada una barra de momentum en +5.0 con un contador de 3 jugadas en +5
    Cuando la barra baja a +4.5
    Entonces el contador de jugadas en +5 pasa a 0

  Escenario: el contador NO acumula entre rachas fragmentadas de +5
    Dada una barra de momentum en +5.0 que se mantuvo 3 jugadas y luego bajó a +4.5
    Cuando la barra vuelve a subir a +5.0 y se mantiene 2 jugadas más
    Entonces el contador de jugadas en +5 es 2, no 5
    Y el bonus post-partido de "5+ jugadas en +5" NO se considera alcanzado por esta racha

  # --- Jerarquía preservada ---

  Escenario: el momentum no invierte la jerarquía de calidad
    Dado un jugador medio (influencia +0.5) con momentum +5 del equipo (Fuerza sostenida ~+1.10)
    Y un jugador élite (influencia +3.5) con momentum -5 del equipo (Fuerza neta ~+2.75)
    Entonces el élite frío sigue teniendo más Fuerza efectiva que el medio encendido
