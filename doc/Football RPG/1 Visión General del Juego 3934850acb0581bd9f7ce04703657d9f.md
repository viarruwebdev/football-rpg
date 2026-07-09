# 1. Visión General del Juego

# Concepto central

Juego web app de fútbol RPG que combina cartas, gestión de franquicia estilo NBA, drama de duelos estilo Captain Tsubasa y estructura roguelite con draft y relegación.

## El modelo: franquicias estilo NBA

- **32 franquicias** con nombres ficticios en una liga única (sin divisiones de ascenso/descenso tradicional)
- **Tú eres el dueño y director** de la franquicia: diriges el equipo, gestionas la plantilla, tomas todas las decisiones
- **Presupuesto igual** para todas las franquicias: la competencia es puramente deportiva y de deckbuilding
- **Todos los jugadores cobran igual:** sin gestión salarial, sin negociaciones de contrato
- **Plantilla de 23 jugadores** con normas obligatorias: 3 porteros mínimo, 4 canteranos (formados en el club) mínimo
- **Sistema de draft** para reconstruir la plantilla cada temporada

## Tres puentes que unen todo

**Puente 1: Tu plantilla ES tu mazo.** Cada jugador que fichas o drafteas aporta sus cartas al mazo. El draft no es solo elegir un número en una tabla: es cambiar cómo juegas.

**Puente 2: El partido se decide en duelos.** Un motor por turnos con cadenas de posesión por cartas donde cada acción disputada abre un duelo donde entran cartas, técnicas y stats.

**Puente 3: La liga es la run.** El roguelite envuelve la carrera. Cada temporada, los 6 equipos de Copa Bronce que no llegan a su final son relegados y sustituidos. Si estás en ese grupo, fin de la run. La amenaza es constante desde la temporada 1.

## Decisiones de diseño confirmadas

- **Gestión simplificada tipo NBA:** sin economía compleja, sin contratos, sin salarios diferenciados
- **Draft anual** como mecanismo principal de adquisición de jugadores
- **Motor por cartas con dos sub-mazos** (ataque + defensa + compartido)
- **Control total en el partido**
- **Permadeath:** cada temporada los 6 peores equipos de Copa Bronce que no lleguen a la final son relegados. Si estás ahí, fin de la run.
- **Meta-progresión entre runs:** desbloqueos permanentes

## Referencias

- **NBA / NBA 2K:** modelo de franquicias, draft, lottery pick, trades
- **Captain Tsubasa 5:** drama de duelos, técnicas especiales, escalada narrativa
- **Football Manager:** atributos completos (incluidos ocultos), desarrollo de jugadores
- **Nutmeg!:** inspiración estética/temática de los mazos
- **LEC Spring 2026:** formato de playoff con lower bracket

## Nombres candidatos

- **Órdago** — Cartas + riesgo/push-your-luck + castellano con carácter
- **Pitch Deck** — Doble sentido: pitch (campo) + deck (mazo). Mercado internacional.
- **Once de Bastos** — "Once" (once titular) + "bastos" (palo de la baraja)