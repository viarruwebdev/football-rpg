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

**Robo al defender:** 2 cartas del mazo de defensa + 1 del mini-mazo compartido (si queda).

**Mano compartida:** Las cartas ofensivas y defensivas conviven en la misma mano. Si al robar excedes 7, descartas a tu elección (lo descartado va al fondo de su sub-mazo correspondiente). La decisión de «qué descarto» es una elección táctica: ¿me deshago de una defensiva floja para hacer hueco a ofensivas mejores, o guardo esa defensa para la siguiente posesión rival?

**Gasto:** 1 carta por eslabón de la cadena. Ataque de 3 eslabones = 3 cartas ofensivas.

**Descarte/mulligan:** Al inicio de tu posesión puedes descartar hasta 2 cartas para robar 2 nuevas del sub-mazo de la fase actual. Riesgo: gastas sub-mazo más rápido.

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
- Desde Ataque: centro improvisado (potencia 0, usa Crossing) o disparo improvisado (potencia 0, usa Finishing/Long Shots con penalización de distancia).
- Desde el Área: remate improvisado (potencia 0, usa Finishing).
- En defensa: defensa a cuerpo limpio (potencia 0, usa Tackling + modificadores de carril/presión/momentum).

Es débil pero no imposible: un delantero con Finishing 18 improvisando tiene fuerza 18. Si el portero juega Parada (potencia 3 + Reflexes 14 = 17), el diferencial es +1. Jugable, no cómodo.

**Opción B — Reconvertir carta de la otra fase (potencia mitad, gasta carta).** Puedes jugar una carta defensiva como ofensiva (o viceversa) con su potencia reducida a la mitad (redondeada abajo). Una Barrida (potencia 4) jugada como "ataque" tiene potencia 2. Una carta de Pase al hueco (potencia 3) jugada como "defensa" tiene potencia 1.

Trade-off: potencia 2 reconvertida es mejor que potencia 0 improvisada, pero pierdes esa carta para cuando la necesites en su fase natural. Un defensor que "ataca" usando su instinto de entrada, un atacante que "defiende" usando su instinto de posición. Torpe pero funcional.

**Opción C — Instantes y tácticas del mini-mazo compartido.** Las cartas compartidas (instantes como Inspiración que roba 2 cartas, Desmarque, Último esfuerzo; tácticas como Cambio de ritmo) son jugables en ambas fases por definición. No sustituyen la acción base pero complementan. Inspiración puede sacarte del apuro robando cartas del sub-mazo correcto.

Las tres opciones conviven. Quedarse sin cartas nunca bloquea pero siempre perjudica. Agotar un sub-mazo es un error estratégico del que puedes sobrevivir, pero que pagas caro.