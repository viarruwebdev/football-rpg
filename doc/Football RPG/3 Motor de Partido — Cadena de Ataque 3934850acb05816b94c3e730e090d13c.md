# 3. Motor de Partido — Cadena de Ataque

Un ataque es una cadena de **duelos** que hace avanzar el balón por zonas hasta rematar. Un duelo es la unidad atómica del partido: un atacante juega carta + un defensor responde + se resuelve. Cada duelo consume exactamente 1 jugada del reloj (ver sección 2 para la tabla completa de consumo).

## Flujo de una posesión atacante

**1. Inicio de posesión:** Robas 2 cartas del sub-mazo de ataque + 1 del compartido. La táctica determina la zona de inicio (ponderada, no aleatoria pura). Asoman 2-3 jugadores en el pool de esa zona.

**2. Cada duelo:** Eliges carta de acción + jugador + destino. El defensor elige carta defensiva + defensor + carril. Se revela simultáneamente y se resuelve. Ambas acciones son parte del mismo duelo (1 jugada del reloj, no 2).

**3. Progresión o pérdida:** Si tienes éxito, el balón avanza. Aparece nueva tanda de jugadores para la nueva zona. Juegas otra carta de la mano en el siguiente duelo. Si fallas, pierdes el balón: se inicia una posesión nueva del rival (robo de cartas, presión reseteada, bonus de transición si aplica).

**4. Remate:** Cuando estás en la franja de Área, puedes rematar (duelo especial contra el portero, consume 1 jugada como cualquier otro duelo).

## El push-your-luck: el corazón roguelite

Cada eslabón hacia adelante tiene un riesgo que SUBE cuanto más te acercas a portería. En cada eslabón puedes:

- **Conservar** — Jugada segura, poco avance, bajo riesgo. Reciclas posición.
- **Progresar** — Más avance o tiro, más riesgo.
- **Rematar** — Cierre de la cadena contra el portero.

La decisión constante: ¿sigo construyendo para un remate mejor, o disparo ya antes de que me quiten el balón?

## Escalada de riesgo dentro de la cadena

Cada eslabón consecutivo suma +1 de presión defensiva acumulada. El primer eslabón es fácil; el cuarto tiene al defensor con +3 de bonus acumulado. Esto obliga a decidir: ¿remato desde lejos o construyo la jugada perfecta arriesgándome al robo?

## Pool de jugadores: no es azar puro

Los jugadores aparecen ponderados por:

- **La táctica y el rol** — El mapa de calor de cada jugador define en qué zonas asoma y con qué frecuencia.
- **Los rasgos** — "Jugador de área" asoma más en el Área; "Organizador" en el tercio medio.
- **Continuidad del portador** — El que acaba de recibir sigue disponible por defecto.
- **Llamar a un jugador con energía** — Gastando garra puedes forzar que aparezca un jugador concreto.

## Economía de cartas (sistema de dos sub-mazos)

El equipo tiene tres mazos separados:

**Mazo de ataque (~18-20 cartas):** Pases, Conducciones/Regates, Tiros, Centros, Técnicas especiales ofensivas.

**Mazo de defensa (~10-12 cartas):** Entradas, Intercepciones, Barridas, Técnicas defensivas. Las cartas de Portero NO están en este mazo (ver sección 2 para el set propio del portero).

**Mini-mazo compartido (~6-8 cartas):** Tácticas, Instantes, Arenga del capitán.

**Mano inicial:** 5 cartas del mazo de ataque + 2 del mazo de defensa = 7 cartas. Mano máxima: 7.

**Robo al atacar:** 2 cartas del mazo de ataque + 1 del mini-mazo compartido (si queda).

**Robo al defender:** **1 carta** del mazo de defensa + 1 del mini-mazo compartido (si queda).

**Cuándo se roba:** al cambiar la posesión, **ambos equipos roban a la vez**, cada uno según el rol que le toca. El que inicia posesión roba 2 ofensivas + 1 compartida; el que pasa a defender roba 1 defensiva + 1 compartida.

> **Por qué el robo es asimétrico (2 vs 1).** El consumo de cartas es casi idéntico en ambas fases (1 carta por eslabón, ataques y defensas duran lo mismo), pero el mazo ofensivo tiene 18-20 cartas y el defensivo 10-12. Con robo simétrico el mazo defensivo se agotaría al doble de velocidad, hacia la mitad del segundo acto. Robando 1 defensiva, ambos relojes de agotamiento suenan a la vez, en el descuento. Además es temáticamente correcto: defender es reactivo — tienes más opciones para atacar que para frenar.
> 

**Mano compartida:** Las cartas ofensivas y defensivas conviven en la misma mano. Si al robar excedes 7, descartas a tu elección (lo descartado va al fondo de su sub-mazo correspondiente). La decisión de «qué descarto» es una elección táctica: ¿me deshago de una defensiva floja para hacer hueco a ofensivas mejores, o guardo esa defensa para la siguiente posesión rival?

**Gasto:** 1 carta por eslabón de la cadena. Ataque de 3 eslabones = 3 cartas ofensivas.

**Destino de las cartas — asimetría deliberada.** Una carta **jugada** sale del juego: no vuelve al mazo, no hay pila de descartes que se rebaraje. Una carta **descartada por exceso de mano** (o por mulligan) vuelve **al fondo de su sub-mazo**. Los sub-mazos **NUNCA se rebarajan**: el agotamiento es una mecánica central, no un accidente. Sin agotamiento, toda la sección "Jugar sin cartas de la fase actual" sería código muerto y el push-your-luck sobre las cartas desaparecería.

**Descarte/mulligan:** al inicio de tu posesión puedes descartar hasta 2 cartas para robar 2 nuevas del sub-mazo de la fase actual. **Máximo una vez por posesión.** No cambia el tamaño de la mano: cambias cartas, no robas de más. Las descartadas van al fondo de su sub-mazo. Si el sub-mazo tiene menos cartas de las que pides, robas las que haya. Riesgo: quemas sub-mazo más rápido, y el mazo no se rebaraja.

**Cuando se agota un sub-mazo:** Solo juegas con lo que quede en mano de ese tipo. Un equipo que ataque constantemente puede llegar al descuento con el mazo ofensivo vacío y el defensivo casi intacto, forzándole a defenderse para sobrevivir. Esa asimetría en el agotamiento genera narrativa emergente.

**Ventajas del sistema de dos sub-mazos:**

- El jugador siempre tiene opciones relevantes para la fase actual
- El deckbuilding es más legible: se ve claramente el tamaño de cada sub-mazo
- Los estilos de juego se sienten más distintos (Catenaccio = defensa gorda, ataque raquítico)
- El ritmo de agotamiento de cada sub-mazo cuenta una historia táctica

## Destino del balón

El destino tiene tres componentes:

- **Franja** (Defensa, Medio, Ataque, Área): cuánto avanzas
- **Carril** (izquierda, centro, derecha): por dónde vas
- **Tipo de avance**: normal (1 franja), profundidad (2 franjas), lateral (cambio carril), retroceso

## Jugar sin cartas de la fase actual

Cuando no tienes cartas de la fase actual en mano (ni ofensivas al atacar, ni defensivas al defender), nunca te quedas bloqueado. Hay tres opciones:

**Opción A — Jugada improvisada (potencia 0, no gasta carta).** El jugador ejecuta una acción genérica según su zona. Siempre disponible.

- Desde Defensa o Medio: pase improvisado (potencia 0, usa Passing, avanza 1 franja).
- Desde Ataque: **la intención la elige el jugador** — centro improvisado (potencia 0, usa Crossing) o disparo improvisado (potencia 0, usa Finishing con penalización de distancia −3; Long Shots ≥16 reduce en 2, ≥18 elimina la penalización). Long Shots mitiga la penalización pero no es el atributo del disparo.
- Desde el Área: remate improvisado (potencia 0, usa Finishing).
- En defensa: defensa a cuerpo limpio (potencia 0, usa Tackling + modificadores de carril/presión/momentum).

Es débil pero no imposible. **Todos los cálculos usan la influencia comprimida de la sección 6 (−4..+4), no el atributo en bruto.**

Un delantero con Finishing 18 (influencia +4) improvisando tiene **Fuerza 4** (potencia 0 + 4). Si un portero mediocre con Reflexes 9 (influencia −1) juega Parada básica (potencia 3), su Fuerza es **2**. Diferencial **+2**: jugable, no cómodo.

Pero un delantero con Finishing 9 (influencia −1) improvisando tiene **Fuerza −1**. Contra ese mismo portero, diferencial **−3**. Y contra un portero de élite con Estirada (potencia 5 + influencia +4 = Fuerza 9), diferencial **−10**.

> **Improvisar no salva a los malos.** La calidad individual pesa más cuando no tienes recursos: al élite le queda una vía, al mediocre no. Quedarse sin cartas es grave, no letal — y solo para los buenos.
> 

Lo mismo en defensa: un defensor con Tackling 18 a cuerpo limpio tiene Fuerza 4 y, si acierta el carril (+2 íntegro), sigue siendo viable. Uno con Tackling 9 tiene Fuerza −1, y si falla el carril, −2.

**Opción B — Reconvertir carta de la otra fase (potencia mitad, gasta carta).** Puedes jugar una carta defensiva como ofensiva (o viceversa) con su potencia **reducida a la mitad, redondeada abajo**.

**Solo se pueden reconvertir cartas de potencia ≥ 2.** Una carta de potencia 1 reconvertida valdría 0: idéntico a improvisar, pero gastando carta. Es una opción estrictamente dominada, así que no existe.

**La carta reconvertida usa el atributo natural de la fase actual, NO el suyo original.** Una Barrida (potencia 4, atributo Tackling) jugada como acción ofensiva vale potencia 2 y suma el **Passing** del jugador que la ejecuta (o el atributo que la acción improvisada usaría en esa zona). Un Pase al hueco (potencia 3, Passing) jugado como defensa vale potencia 1 — y por tanto **no es reconvertible** (potencia < 2).

> **Por qué el atributo natural y no el original.** Si la carta conservara su atributo, un central con Tackling 18 atacaría mejor reconvirtiendo una Barrida (2+4=6) que un delantero con una carta de pase real. La reconversión aporta **potencia bruta**, no la habilidad ajena.
> 

Comparado con improvisar (potencia 0 + atributo natural), reconvertir da exactamente **la potencia reducida de la carta** a cambio de gastarla. Trade-off limpio: ¿valen 2 puntos de Fuerza quemar esta carta que quizá necesite en su fase natural?

**Opción C — Instantes y tácticas del mini-mazo compartido.** Las cartas compartidas (instantes como Inspiración que roba 2 cartas, Desmarque, Último esfuerzo; tácticas como Cambio de ritmo) son jugables en ambas fases por definición. No sustituyen la acción base pero complementan. Inspiración puede sacarte del apuro robando cartas del sub-mazo correcto.

**Reglas de los instantes.** Se juegan en la fase **pre-revelado** del duelo (paso 2 de la secuencia de la sección 6), **adicionales** a la carta de acción — no la sustituyen. No consumen jugada del reloj (el duelo entero es 1 jugada). **Máximo 1 instante por duelo y por jugador**: tanto el atacante como el defensor pueden jugar el suyo. Los instantes que suman potencia **no se apilan sobre técnicas especiales** (Último esfuerzo no aplica sobre una técnica especial).

Las tres opciones conviven. Quedarse sin cartas nunca bloquea pero siempre perjudica. Agotar un sub-mazo es un error estratégico del que puedes sobrevivir, pero que pagas caro.