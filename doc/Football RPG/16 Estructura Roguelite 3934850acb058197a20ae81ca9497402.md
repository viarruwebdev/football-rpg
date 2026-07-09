# 16. Estructura Roguelite

# La run = tu carrera como dueño de franquicia

Tu carrera dura mientras tu franquicia sobreviva. Dentro de ella, la gestión es persistente: desarrollas canteranos, construyes química, evolucionas jugadores temporada a temporada.

## Permadeath: relegación cada temporada

**Cada temporada, los 6 equipos de Copa Bronce que NO llegaron a la final son relegados.** Los 2 finalistas sobreviven. 6 franquicias nuevas entran a la liga.

Si estás entre los 6 peores sin llegar a la final de Copa Bronce, tu run termina. La amenaza es constante desde la temporada 1: no hay temporadas de gracia.

La Copa Bronce es el "survival bracket": sus playoffs son el torneo más tenso del juego porque perder = muerte. Los 2 finalistas sobreviven y obtienen los mejores picks del draft.

## Progresión meta entre runs

Perder no es frustrante si desbloqueas algo:

- Nuevos perfiles de staff inicial (diferentes tipos de director de cantera, ojeador, etc.)
- Condiciones iniciales de la franquicia
- Arquetipos de cartas o técnicas especiales desbloqueables
- Cosméticos de la franquicia

## Generación procedural de cada run

Al iniciar una nueva carrera:

- Franquicia generada con plantilla aleatoria de 23 jugadores (buenos jugadores, no mediocres)
- Al menos 4 canteranos etiquetados en la plantilla inicial
- Juveniles generados aleatoriamente en la cantera
- Staff inicial generado aleatoriamente
- Las otras 31 franquicias generadas con sus propias plantillas
- Ninguna carrera se parece a otra

## Variedad partido a partido

**Condiciones de partido:** lluvia, calor, campo malo, nocturno. Generadas proceduralmente.

**Rivales con identidad:** cada franquicia tiene tendencia táctica y gimmicks. Fuerza adaptación.

**Partidos "jefe":** playoffs, finales de copa, partidos de relegación. Reglas especiales, tensión máxima.

## El bucle de cada temporada

1. **Inicio de temporada:** pactos opcionales, evalúas plantilla, eliges formación/estilo
2. **Fase suizo:** 32 franquicias compiten. Los 8 primeros en llegar a 5 victorias → Championship. El resto se ordena por récord en 3 copas (Oro, Plata, Bronce)
3. **Playoff de cada división:** 6 clasificados, formato double elimination con lower bracket penalizado (-0.5 influencia)
4. **Relegación:** los 6 no-finalistas de Copa Bronce son eliminados. Los 2 finalistas sobreviven.
5. **Fin de temporada:** eliges 15 jugadores a retener (los jugadores pueden rechazar). Los descartados + canteranos no promovidos → bolsa del draft
6. **Pre-draft:** intercambios de jugadores entre franquicias (se pueden incluir rondas de draft)
7. **Draft:** lottery pick (anti-tanking: mejores de Copa Bronce eligen primero) + elección por turnos hasta completar plantilla de 23

## Builds viables (rejugabilidad)

Cada combinación de plantilla + táctica + estilo genera un mazo distinto:

- **Equipo de pases** — Mediapuntas élite, cadenas largas, tiki-taka
- **Contragolpe** — Extremos rápidos, delantero goleador, cadenas de 2-3 eslabones
- **Tanque aéreo** — Centros al segundo palo, delantero con Heading alto
- **Estrella individual** — Crack con técnicas devastadoras, equipo funcional alrededor
- **La muralla** — Defensas con Tackling, portero con técnica especial. Gana 1-0.
- **Dinastía de canteranos** — Invertir en cantera, construir química máxima entre hermanos de generación

Ningún build es imbatible: cada uno tiene contrapartidas naturales. El draft te obliga a adaptar tu build cada temporada según lo que esté disponible.

---

# Semillas de liga

Cada run genera **1 semilla principal + 1 semilla secundaria** al azar. Las semillas son visibles para el jugador al inicio de la run. ~500 combinaciones posibles (20×25).

## Semillas principales (1 al azar)

**"Era de los cracks"** — +10 PA medio en toda la liga. Más talento pero TODOS más fuertes. Partidos de titanes.

**"Época de sequía"** — -10 PA medio. Escasez de talento. Jugadores mediocres valen oro. Cantera importa más.

**"Liga de veteranos"** — Declive -30% más lento. Hornadas de cantera -15%. Premia retención y estabilidad.

**"Revolución juvenil"** — Declive +30% más rápido. Hornadas +20% mejores. Los jóvenes dominan.

**"Meta defensivo"** — Cartas defensivas +1 potencia global. Partidos cerrados (1-0, 0-0). Porteros y defensas más valiosos.

**"Meta ofensivo"** — Cartas ofensivas +1 potencia. Más goles, remontadas. Delanteros valen el doble.

**"Caos"** — Banda incertidumbre ±8 (en vez de ±6). Todo impredecible. Composure alta es lo único que controla.

**"Precisión"** — Banda ±4. Resultados previsibles. Mejor preparado gana casi siempre.

**"Liga de las lesiones"** — Probabilidad lesión +25%. Profundidad de plantilla y preparador físico lo son todo.

**"Liga de hierro"** — Lesiones -25%. Titulares pueden jugar todo sin rotar. Calidad del once > profundidad.

**"Mercenarios"** — +15% probabilidad rechazo en retención. Rotación agresiva. Química difícil.

**"Lealtad"** — -15% rechazo. Más estabilidad. Pero draft tiene menos jugadores buenos (nadie se va).

**"Pressing total"** — Pressing alto -30% coste energía. IA usa pressing más. Partidos frenéticos. Stamina es rey.

**"Catenaccio global"** — Presión defensiva +1.5 por eslabón (en vez de +1). Atacar es difícil. Balón parado decide.

**"Boom de canteranos"** — Canteras producen 1-2 extra por hornada. Pool draft lleno de jóvenes.

**"Edad dorada de porteros"** — Porteros +15 PA medio. Marcar es más difícil. Portero es la posición más valiosa.

**"Fútbol de extremos"** — Laterales +1 potencia, centros +1. Central -1 ofensivo. Extremos desbordantes dominan.

**"Tiki-taka mundial"** — Pases cortos +1 potencia. Posesión naturalmente más fuerte.

**"Route one"** — Profundidad y largos +1 potencia. Juego directo viable. Delanteros tanque con Heading valen más.

**"Volatilidad táctica"** — Cada 5 partidos del suizo se genera un micro-meta aleatorio. Obliga plantilla versátil.

## Semillas secundarias (1 al azar, compatible)

**"Lluvias persistentes"** — 40% partidos bajo lluvia. Más varianza en pases, regates más efectivos.

**"Campos perfectos"** — Nunca campos malos. Todo limpio y técnico.

**"Campañas relámpago"** — Suizo con 4 victorias/derrotas (en vez de 5). Temporada más corta, cada partido pesa más.

**"Maratón"** — Suizo necesita 6 victorias/derrotas. Más desgaste, más importancia de profundidad.

**"Draft profundo"** — Pool +30% jugadores. Más opciones, más joyas en rondas tardías.

**"Draft escaso"** — Pool -30% jugadores. Más competencia por cada jugador bueno.

**"Química instantánea"** — Química sube +50% más rápido. Pero baja +50% más rápido si algo sale mal.

**"Química lenta"** — Sube -30% más lento. Pero una vez construida, degrada más lento.

**"Hornadas grandes"** — 6-8 canteranos por hornada (en vez de 3-6).

**"Hornadas pequeñas"** — 2-4 por hornada. Cada canterano más valioso.

**"Rasgos exóticos"** — Jugadores con +1 rasgo de media. Más drama de vestuario.

**"Jugadores simples"** — -1 rasgo de media. Menos drama, pocos rasgos importan más.

**"Staff inestable"** — Cada 2 temporadas, 30% de que un staff reciba oferta y se vaya.

**"Staff leal"** — Staff nunca se va salvo despido.

**"Eventos frecuentes"** — Frecuencia +50%. Más drama, más decisiones.

**"Temporada tranquila"** — Frecuencia -30%. Menos interrupciones.

**"Evaluación acelerada"** — Se relegan 8 en vez de 6 de Copa Bronce (solo el campeón sobrevive). Más presión.

**"Evaluación relajada"** — Se relegan solo 4 de Copa Bronce (los 4 finalistas sobreviven). Más margen.

**"Suizo salvaje"** — Emparejamientos aleatorios (no por récord). Caos en clasificación.

**"Playoff extendido"** — Los 8 de cada división clasifican (no 6).

**"Sin lower bracket"** — Eliminación directa pura. Sin segunda oportunidad.

**"Canteranos precoces"** — Debut desde los 15. Más verdes pero acelerador de desarrollo más potente.

**"Trades libres"** — Trades en cualquier momento de la temporada.

**"Sin trades"** — Solo draft y retención. Lo que tienes es lo que hay.

**"Momentum amplificado"** — La barra de momentum se mueve ×2 (se alcanzan los umbrales antes). El efecto de Fuerza sigue capado en ±0.75.

**"Momentum congelado"** — La barra de momentum se mueve ×0.5. Cuesta llegar a los umbrales. Más estable: quien marca primero manda.

## Combinaciones ejemplo

- "Era de los cracks" + "Química instantánea" → Dream teams con conexiones rápidas
- "Época de sequía" + "Draft escaso" → Supervivencia pura, cada jugador decente vale oro
- "Caos" + "Eventos frecuentes" → Todo arde, todo puede pasar
- "Precisión" + "Sin lower bracket" → Cero margen de error, perfeccionismo
- "Meta defensivo" + "Catenaccio global" → Fútbol italiano de los 90
- "Revolución juvenil" + "Canteranos precoces" → La Masía, prodigios de 15 años
- "Mercenarios" + "Sin trades" → Reconstruyes cada temporada desde cero

---

# Escalada de dificultad visible

Cada ciclo de 3 temporadas, las **6 franquicias nuevas** que entran cada temporada (sustituyendo a las relegadas de Copa Bronce) llegan con plantillas **ligeramente mejores que la media** de la liga (+5 PA medio en su generación).

Además, el **pool del draft mejora gradualmente**: cada temporada, los jugadores jóvenes nuevos generados para la bolsa del draft tienen +1 PA medio acumulativo respecto a la temporada anterior. En la temporada 9, el talento base del draft es +9 PA superior al de la temporada 1.

Efecto: sobrevivir en la temporada 9 es objetivamente más difícil que en la temporada 3. La liga sube de nivel con el tiempo. La escalada es el motor de tensión que un roguelite necesita.

---

# Consumibles intra-run

Recursos de un solo uso que se ganan por logros dentro de la run (no entre runs, eso es Legado). Se gastan en momentos críticos. Generan decisiones de "¿lo uso ahora o lo guardo?"

## Tipos de consumibles

**Ficha de ojeo** — Revela el PA real (no estimado) de 1 jugador del draft. Elimina la incertidumbre de ese pick. Se gana: clasificarse al Championship, ganar cualquier copa.

**Impulso de desarrollo** — +5 CA instantáneo a 1 jugador. Se gana: desarrollar un canterano hasta técnica especial, tener una pareja en Telepatía.

**Comodín táctico** — En 1 partido, puedes cambiar de estilo/formación SIN el coste de adaptación (sin los 2-3 partidos de rendimiento reducido). Se gana: ganar 5+ partidos seguidos en el suizo.

**Blindaje de retención** — 1 jugador de tu elección acepta la retención garantizado (ignora moral, rasgos, resultados). Se gana: sobrevivir en Copa Bronce (llegar a la final del survival bracket).

**Convocatoria estrella** — Añade 1 jugador temporal de alta calidad (PA 150+, generado proceduralmente) a tu plantilla durante 3 partidos. No cuenta como canterano ni se queda después. Se gana: ganar el Championship.

## Límite y caducidad

Máximo 3 consumibles guardados a la vez. Si tienes 3 y ganas otro, debes usar o descartar 1.

**Los consumibles caducan por fases de competición.** No se guardan entre fases.

| Tipo de consumible | Caduca al final de... |
| --- | --- |
| Comodín táctico | La fase en que se ganó (suizo o playoff) |
| Convocatoria estrella | La fase en que se ganó |
| Impulso de desarrollo | La fase en que se ganó |
| Escudo anti-cicatriz | La fase en que se ganó |
| Blindaje de retención | Fase de draft/retención (se reserva automáticamente) |
| Ficha de ojeo | Fase de draft (se reserva automáticamente) |
| Ficha retención doble | Fase de draft/retención (se reserva) |
| Elección de draft (legendario) | Fase de draft (se reserva) |

Los consumibles de tipo "draft/retención" se reservan automáticamente para la fase donde son útiles. El resto caduca con su fase, forzando decisiones de "ahora o nunca".

Tres ventanas de urgencia por temporada:

- **Suizo:** "¿Uso el comodín ahora o lo pierdo al clasificarme?"
- **Playoffs:** "¿Uso el impulso antes de la final o lo pierdo?"
- **Draft:** "¿Uso la ficha de ojeo en este pick misterioso o en el siguiente?"

---

# Picks misteriosos en el draft

En cada draft, además de los jugadores visibles, hay **2-3 "picks misteriosos"**: jugadores con TODOS los atributos ocultos. Solo ves un rango amplio de estrellas (★★-★★★★) y su posición.

Draftear un pick misterioso es una apuesta pura: puede ser una joya (PA 170+ con rasgos brillantes) o un desastre (PA 80 con "Cristal" y "Perezoso"). No hay forma de saberlo antes de elegirlo. Tu ojeador NO puede investigar picks misteriosos (son inmunes a informes).

La probabilidad de que un pick misterioso sea bueno es ~40% (bueno a excelente), ~35% (mediocre) y ~25% (malo a desastroso). El riesgo-recompensa es alto.

Si aciertas, es la historia de la temporada. El cofre misterioso del roguelite.

---

# Cicatrices de la run

Cuando pasan cosas malas significativas, la franquicia gana una **"cicatriz"**: un modificador negativo temporal que dura 1-2 temporadas y que debes gestionar. Las cicatrices son el peso de los errores y la mala suerte.

## Cicatrices posibles

**"Vestuario tocado"** — La química se construye un 50% más lento durante 2 temporadas. Se activa tras: crisis de vestuario no resuelta, conflicto que dividió al equipo.

**"Reputación dañada"** — Los jugadores del draft empiezan con -1 moral (no querían ir ahí). Se activa tras: acabar en Copa Bronce, escándalo de un jugador.

**"Miedo escénico"** — En partidos de playoff, todos los jugadores tienen -0.5 de influencia temporal. Se activa tras: ser eliminado en primera ronda del playoff 2 temporadas seguidas.

**"Cantera en crisis"** — La siguiente hornada de canteranos tiene -10 de μ en la campana de Gauss. Se activa tras: descartar a 3+ canteranos en una misma temporada.

**"Sombra del crack perdido"** — Si pierdes a tu jugador de mayor CA (por rechazo de retención, lesión que retira, o trade), la moral de grupo baja 1 escalón y la química media baja -5 durante 1 temporada. El equipo echa de menos a su estrella.

**"Maldición del draft"** — Si tu pick de primera ronda resulta ser un jugador con PA <80 (elegiste mal), en el siguiente draft tu primera ronda baja 2 posiciones (la mala fama de tu departamento de scouting). Dura 1 temporada.

Las cicatrices son visibles para el jugador: sabe qué modificadores negativos arrastra y cuánto duran. Puede planificar en torno a ellas. No son castigos ocultos: son desafíos visibles que gestionar.

---

# Hitos con recompensa intra-run

Ciertos logros dan recompensas inmediatas dentro de la carrera (no solo Legado al final). Mantienen la motivación temporada a temporada.

## Hitos y recompensas

| Hito | Recompensa intra-run |
| --- | --- |
| Ganar tu primer título (cualquier copa) | Desbloquea 1 carta táctica extra para el resto de la run |
| Desarrollar 3 canteranos simultáneamente (3 canteranos con 10+ partidos en la misma temporada) | 1 impulso de desarrollo gratuito |
| Construir 3 parejas en Complicidad o superior | +3 química media grupal permanente para el resto de la run |
| Ganar el Championship | 1 convocatoria estrella (consumible) |
| Remontar un partido de playoff perdiendo 0-2 | El jugador que marcó el gol de la remontada gana +3 PA permanente |
| Mantener a un jugador 5+ temporadas | El jugador gana rasgo "Ídolo local" si no lo tenía |
| Completar una temporada sin lesiones graves | Preparador físico gana +½ estrella temporal durante la siguiente temporada |
| Ganar el suizo invicto (5-0) | Toda la plantilla empieza la fase de playoff con +1 moral |

---

# Pactos de temporada (beneficio + maldición)

Al inicio de cada temporada se ofrecen 2-3 **pactos opcionales.** Cada pacto da un beneficio potente y una maldición permanente para la temporada. Puedes aceptar 0, 1 o varios. Son irreversibles una vez aceptados.

## Pactos disponibles

**"Pacto del goleador"** — Beneficio: tu delantero con más goles gana +2 Finishing permanente al final de temporada. Maldición: los demás delanteros pierden -1 moral permanente (a la sombra del favorito).

**"Pacto de sangre nueva"** — Beneficio: los 3 jugadores más jóvenes ganan ×1.5 progresión. Maldición: los 3 más veteranos pierden -1 a todos los atributos físicos inmediatamente.

**"Pacto del muro"** — Beneficio: defensas ganan +1 potencia en cartas defensivas. Maldición: delanteros pierden -1 potencia en cartas ofensivas.

**"Pacto del ojeador"** — Beneficio: ojeador funciona +1 estrella. Maldición: asistente funciona -1 estrella.

**"Pacto del momentum"** — Beneficio: los bonus de umbral se activan 1 escalón antes (+2/+3/+4 en vez de +3/+4/+5). Maldición: cuando pierdes un duelo, el momentum baja -2 (en vez de -1). El cap de Fuerza (±0.75) no cambia.

**"Pacto del capitán"** — Beneficio: el capitán gana +2 influencia permanente toda la temporada. Maldición: si el capitán se lesiona o pierde moral, TODA la plantilla baja 2 escalones de moral (en vez de 1).

**"Pacto del draft"** — Beneficio: en el próximo draft, tu primera ronda sube 3 posiciones. Maldición: pierdes 1 slot de retención (retienes 14 en vez de 15 esta temporada).

**"Pacto de la cantera"** — Beneficio: la próxima hornada tiene +15 μ en la campana. Maldición: no puedes convocar canteranos al primer equipo esta temporada (solo entrenan).

**"Pacto del pressing"** — Beneficio: el pressing alto no cuesta energía esta temporada. Maldición: la energía máxima baja de 12 a 9 (menos recursos para todo lo demás).

**"Pacto del veterano"** — Beneficio: todos los jugadores 30+ ganan +1 a todos los mentales. Maldición: su declive físico se acelera ×1.5 esta temporada.

## Reglas

- Se ofrecen 2-3 pactos al azar al inicio de cada temporada
- Puedes aceptar 0, 1 o varios
- Irreversibles: duran toda la temporada
- Se muestran con su beneficio y maldición claramente antes de decidir
- Aceptar varios puede crear combinaciones poderosas o explosivas

---

# Eras de la liga (escalada visible)

Cada 2 temporadas la liga sube de nivel con una pantalla narrativa que anuncia la nueva era. La dificultad sube y las recompensas escalan.

| Era | Temporadas | Efecto |
| --- | --- | --- |
| Fundacional | T1-2 | Dificultad base. La liga se forma. |
| Rivalidades | T3-4 | IA +10% acierto adaptación. Némesis más peligrosa. |
| Dinastías | T5-6 | Franquicias Dinastía +10 PA. Recompensas raras más frecuentes. |
| Dorada | T7-8 | Draft +15 PA medio. Pactos más potentes (mayor beneficio Y mayor maldición). |
| Legendaria | T9+ | Todo al máximo. Recompensas legendarias de era exclusivas (+5 PA, técnica especial para jugador sin ella, duplicar bonus química). Solo las franquicias mejor construidas sobreviven. |

Las eras se acumulan con la escalada mecánica existente (franquicias nuevas +5 PA, draft +1 PA/temporada). La era es la manifestación VISIBLE de esa escalada: el jugador siente que ha subido de piso.

---

# Desafíos de partido (riesgo voluntario)

Antes de ciertos partidos (playoffs, partidos clave del suizo), puedes declarar un **desafío opcional.** Máximo 1 por partido. No declarar ninguno es válido. Push-your-luck puro.

## Desafíos disponibles

**"Victoria por goleada"** — Si ganas por 3+ goles: recompensa post-partido mejorada a legendaria. Si no: sin bonus extra (sin castigo).

**"Sin tu estrella"** — Juegas sin tu jugador de mayor CA. Si ganas: +5 Legado y +3 CA al jugador que rinda mejor. Si pierdes: cicatriz "Moral tocada" 3 partidos.

**"Gol del canterano"** — Un canterano de tu elección debe marcar. Si marca: +5 PA permanente al canterano. Si no marca: nada (sin castigo).

**"Remontada declarada"** — Declaras que ganarás incluso si vas perdiendo. Si remontas de ir perdiendo: recompensa ×3. Si ganas sin haber ido perdiendo: recompensa normal. Si pierdes: cicatriz "Arrogancia" (-1 moral grupo 5 partidos).

**"Clean sheet"** — Si no recibes gol: +3 CA a tu portero y +5 química entre centrales. Si recibes: nada.

## Escalado de recompensas y pactos por era

| Era | Recompensas post-partido | Pactos de temporada |
| --- | --- | --- |
| Fundacional (T1-2) | Normales. Raras infrecuentes. | Beneficios y maldiciones moderados |
| Rivalidades (T3-4) | Raras más frecuentes (+10% aparición) | Más potentes (mayor beneficio Y mayor maldición) |
| Dinastías (T5-6) | Recompensas de era exclusivas: +2 PA, carta táctica permanente, canterano extra PA+15 | Beneficios/maldiciones mayores. Pactos de era exclusivos |
| Dorada (T7-8) | Era mejoradas: +3 PA, canterano extra PA+20, staff temporal +1 estrella | Pactos extremos |
| Legendaria (T9+) | Legendarias de era: +5 PA, técnica especial para jugador sin ella, duplicar bonus química 5 partidos | Pactos épicos (recompensas enormes con riesgos enormes) |

Las runs largas son cualitativamente distintas: más difíciles pero con herramientas y decisiones más grandes. El jugador que llega a T9 ve cosas que nunca existieron antes.