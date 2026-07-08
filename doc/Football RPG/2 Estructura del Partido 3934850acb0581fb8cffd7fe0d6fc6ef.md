# 2. Estructura del Partido

El partido se mide en **jugadas totales** compartidas entre ambos equipos. La unidad básica es el **duelo**: un atacante juega una carta + un defensor responde + se resuelve. Eso es 1 jugada del reloj, siempre.

## Tres actos con escalada de tensión

**Primera parte: 30 jugadas.** Ritmo de exploración. Las manos están llenas, la energía alta, la fatiga baja. Se tantea al rival, se descubre su gimmick, se construye momentum.

**Segunda parte: 30 jugadas.** La fatiga empieza a morder. Las manos más vacías, la energía escasea. Los errores pesan más porque cada jugada desperdiciada es más cara proporcionalmente.

**Descuento: 4-8 jugadas** (variable según eventos del partido). Tensión máxima. Cada jugada puede ser la última. El número exacto es **semioculto**: el jugador ve un rango estimado (ej: "4-7 jugadas") pero no el número exacto. Se revela solo cuando quedan 2 jugadas. El rango se estima por faltas, lesiones y cambios acumulados.

Total aproximado: 64-68 jugadas por partido. Partidos de unos 15-20 minutos reales.

## Qué genera el descuento variable

No es aleatorio puro. Lo generan los eventos consumidores de tiempo:

- Cada falta cometida durante el partido: +0.5 jugadas de descuento
- Cada lesión: +1 jugada
- Cada cambio de jugador: +0.5 jugadas

Un partido sucio con muchas faltas tiene más descuento. Si vas perdiendo y quieres más tiempo, puedes cometer faltas (arriesgando tarjetas pero ganando jugadas extra). Pacto con el diablo.

## El duelo como unidad básica del reloj

Un **duelo** = un atacante juega carta + un defensor responde + se resuelve. Es la unidad atómica del partido. Atacante y defensor actúan dentro del mismo duelo: no son dos acciones separadas.

**Un duelo = 1 jugada del reloj.** No importa quién ataca o defiende. Un ataque de 3 eslabones = 3 duelos = 3 jugadas. La defensa de esos 3 eslabones ya está incluida (no cuenta aparte).

### Tabla de consumo de jugadas

| Evento | Jugadas que consume |
| --- | --- |
| Duelo normal (ataque + defensa) | 1 |
| Balón dividido (mini-duelo extra) | +1 (total: 2 por ese eslabón) |
| Falta + tiro libre | +1 (falta interrumpe, tiro libre se reanuda) |
| Córner | 2 (preparación + duelo aéreo) |
| Penalti | 2 (preparación + duelo tirador vs portero) |
| Sustitución | 1 (preparación del cambio) |
| Cambio de carril (sin duelo) | 1 |
| Pase de seguridad (sin duelo) | 1 |
| Posesión estéril | 2 |
| Remate a portería | 1 (es un duelo: tirador vs portero) |

**NO consume jugada:** robar cartas del mazo (automático), descartar (parte de la fase de robo), efectos pasivos de rasgos o momentum.

## Inversión de roles (robo de balón)

Un robo de balón **termina la posesión del atacante e inicia una posesión nueva** del que robó. Es un corte limpio.

**Se activa el robo de cartas.** El equipo que robó saca 2 cartas de su sub-mazo de ataque + 1 del compartido (inicio de posesión atacante). El equipo que perdió el balón NO roba todavía (robará cuando empiece su siguiente posesión).

**Los bonus de transición se aplican.** Si el estilo o instrucciones dan bonus por transición (Contragolpe: +3 primer eslabón; Transición letal: jugador rápido garantizado), se aplican ahora.

**El reloj NO se pausa.** El contragolpe sigue consumiendo del mismo reloj compartido.

**La presión acumulada se resetea a 0.** La nueva posesión empieza limpia (los bonus de transición son puntuales, no presión acumulada).

## Quién saca primero

Al inicio de cada parte se determina quién tiene la primera posesión. En la primera parte, el equipo local saca primero. En la segunda, el visitante.

## ¿Hay mínimo de posesiones garantizadas?

No. Si un equipo construye ataques largos y el otro cortos, el primero consume más reloj por posesión. Es coherente con el fútbol real y es decisión táctica legítima (quemar reloj cuando vas ganando).

El freno natural contra el abuso: si monopolizas el balón y pierdes la posesión, el rival inicia contragolpe, roba cartas, y puede marcar con un ataque corto. Las cartas tácticas como Pressing total y las instrucciones como "Faltas tácticas en transición" existen precisamente para frenar al equipo que acapara.

## Reloj a 0: final del partido

Si el reloj llega a 0 durante una posesión atacante, el atacante **puede completar el duelo en curso** (se resuelve el eslabón actual). Si ese eslabón resulta en remate, el remate se ejecuta. Si no, la posesión se corta y el partido termina.

**Excepción — último suspiro:** si el equipo que ataca va perdiendo y quedan 0 jugadas, puede jugar **1 duelo extra** (solo 1). Si resulta en remate, se ejecuta. Si no, se acabó. Es el equivalente del "balón que queda en el aire cuando suena el pitido": se deja terminar la jugada.

## Sistema de dos sub-mazos

El mazo del equipo se divide en tres:

**Mazo de ataque (~18-20 cartas):** Pases, Conducciones/Regates, Tiros, Centros, Técnicas especiales ofensivas. Se roba de aquí cuando atacas.

**Mazo de defensa (~10-12 cartas):** Entradas, Intercepciones, Barridas, Técnicas especiales defensivas. Se roba de aquí cuando defiendes. Las cartas de Portero NO están en este mazo.

**Set propio del portero:** El portero tiene un mini-set siempre disponible, separado de los sub-mazos. Una Parada básica está siempre jugable (no se roba del mazo). Las cartas superiores (Estirada, Blocaje, Despeje de puños, Achique) se añaden a su set según sus atributos y se regeneran entre posesiones. Esto evita el problema de robar cartas de portero cuando defiendes eslabones normales (no remates) y quedarte con cartas muertas en mano.

**Mini-mazo compartido (~6-8 cartas):** Tácticas, Instantes, Arenga del capitán. Se roba 1 carta adicional de aquí en cada posesión (atacante o defensiva) si queda alguna.

La mano es única y compartida entre fases (máximo 7 cartas). Las cartas ofensivas y defensivas conviven en la misma mano. Si al robar excedes 7, descartas a tu elección (lo descartado va al fondo de su sub-mazo correspondiente).

## Sustituciones y cartas

Al sustituir un jugador: las cartas que aporto al mazo y siguen en el sub-mazo se retiran (se descartan sin efecto). Las cartas suyas ya en tu mano se quedan y son jugables, pero sin el bonus de atributo del jugador original (si las juega otro jugador, usa el atributo del nuevo). Las cartas del sustituto se barajan en el sub-mazo correspondiente inmediatamente.

**Portero lesionado sin cambios:** un jugador de campo va a portería. Tiene acceso solo a la Parada básica (siempre disponible). Sus atributos de portero son efectivamente 1-5. Es una situación desesperada que se siente desesperada.

## Suelo mínimo de cartas para equipos débiles

Independientemente de los atributos de la plantilla, el sub-mazo de ataque tiene un mínimo de 14 cartas y el de defensa un mínimo de 8. Si los jugadores no aportan suficientes, se rellenan con cartas genéricas de relleno (Pase corto potencia 1, Entrada potencia 1). El equipo débil juega con cartas peores, no sin cartas.

## El descanso

Entre los dos tiempos puedes:

- Ajustar instrucciones de equipo libremente
- Hacer cambios de jugador
- Elegir una instrucción de vestuario entre 2-3 opciones generadas por el contexto del partido

## Por qué jugadas totales y no posesiones fijas

**El tiempo se convierte en recurso.** Un ataque elaborado de 5 eslabones consume 5 jugadas. Un contragolpe de 2 consume 2. El que controla la posesión controla el reloj, pero paga con tempo.

**Cada eslabón extra es triple apuesta.** Añadir un eslabón arriesga: pérdida del balón, una carta de la mano, y una jugada del reloj. Push-your-luck elevado al cubo.

**Los estilos de juego se diferencian de verdad.** Posesión gasta más reloj pero controla. Contragolpe cede reloj pero ataca quirúrgicamente. Defensivo quiere que el rival gaste jugadas atacando para que el partido se acabe.

**Gestión de partido nueva.** Si vas ganando 1-0 y quedan pocas jugadas, construyes ataques largos para quemar reloj. Si vas perdiendo, ataques cortos y directos.

---

# Prórroga y penaltis (no existen los empates)

En este juego **no hay empates.** Todos los partidos tienen un ganador.

## Prórroga

Si el partido termina empatado tras el tiempo reglamentario (60 jugadas + descuento), se juega una **prórroga de 20 jugadas** (10 + 10, dos partes). Las reglas son las mismas que el tiempo reglamentario pero con estos ajustes:

- La fatiga acumulada del partido se arrastra (los jugadores que más jugaron están agotados)
- Se permite **1 sustitución extra** (además de las 3 del reglamentario)
- No hay descuento en la prórroga (10 jugadas fijas por parte)
- El momentum se resetea a 0 al inicio de la prórroga

## Penaltis

Si la prórroga termina en empate, se resuelve por **penaltis.** Duelo puro tirador vs portero con apuesta de palo (3 carriles: izquierda, centro, derecha):

- 5 penaltis por equipo (alternados)
- Si persiste el empate tras 5, muerte súbita (1 penalti por equipo hasta que uno marque y el otro falle)
- El tirador usa Finishing + Penalty Taking + Composure. El portero usa Reflexes + One on Ones + Composure
- Composure es el atributo más importante en penaltis: banda reducida a ±3 con Composure 18+
- El jugador elige el orden de tiradores (decisión táctica: ¿pones al mejor primero para dar confianza, o lo guardas para el 5º decisivo?)

---

# Modos de velocidad de partido

El jugador elige antes de cada partido qué modo quiere. Permite ajustar el ritmo según la importancia del partido.

## Modo Completo

Juegas cada eslabón manualmente. 60+ decisiones. ~20-30 minutos. Para partidos que importan: playoffs, finales, rivales fuertes, partidos con desafío declarado. Acceso total a recompensas post-partido (elige 1 de 3).

## Modo Táctico

Solo intervienes en el primer eslabón de cada posesión (eliges la primera carta y el primer jugador). El resto de la cadena se resuelve automáticamente siguiendo tu estilo e instrucciones. ~8-12 decisiones por partido. ~8-10 minutos. Para partidos de suizo normales. Acceso total a recompensas post-partido.

## Modo Resumen

El partido se simula completamente. Ves un resumen: goles, jugadores destacados, eventos clave, resultado. ~1 minuto. Para partidos intrascendentes. **Coste: pierdes la elección de recompensa post-partido** (se elige automáticamente la opción con más atributos prioritarios del rol). Si quieres las mejores recompensas, tienes que jugar.

## Restricciones

- Partidos de playoff y finales de copa: mínimo Modo Táctico (no se pueden simular en Resumen)
- Partidos con desafío declarado: obligatorio Modo Completo
- Partidos con modificador activo: mínimo Modo Táctico