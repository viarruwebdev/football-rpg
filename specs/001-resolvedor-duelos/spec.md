# Especificación — Resolvedor de duelos

**Feature branch:** `001-resolvedor-duelos`
**Estado:** Clarificada (lista para `/speckit.plan`)
**Creada:** 2026-07-08
**Fuente de verdad de las reglas:** manual §6 (Tabla de Resolución) · skill `football-rules`

---

## Resumen

El duelo es la unidad atómica del partido: un atacante juega una carta y un defensor responde; el sistema resuelve quién gana y con qué contundencia. Esta feature entrega **la resolución de un único duelo de eslabón normal** de forma **determinista**: dados los mismos inputs y la misma semilla, produce siempre el mismo resultado y los mismos eventos. Es la pieza que valida toda la tesis del proyecto (motor puro), y sobre la que se construirá el resto del partido.

No modela todavía: energía, fatiga, momentum (como estado), química, la cadena de posesión completa, ni el remate contra el portero (feature 002).

---

## Escenarios de usuario y pruebas

### Historia 1 (P1) — Un duelo se resuelve de forma justa y contundente

Como jugador, cuando enfrento mi carta contra la respuesta del rival, quiero que el resultado refleje la fuerza combinada de carta + jugador + situación, con un abanico de desenlaces (desde éxito aplastante hasta contragolpe devastador), para que cada duelo tenga tensión y consecuencias claras.

**Aceptación:**
- Dado un atacante claramente superior, cuando se resuelve el duelo, entonces el desenlace tiende a los tramos favorables al atacante, pero el inferior conserva una posibilidad real.
- Dado un resultado, entonces cae en exactamente uno de los siete tramos de la tabla de eslabón normal.

### Historia 2 (P1) — El resultado es reproducible

Como desarrollador, quiero que resolver el mismo duelo con la misma semilla dé siempre el mismo resultado, para poder testear, depurar por semilla y validar el balance por simulación.

**Aceptación:**
- Dado un duelo y una semilla, cuando lo resuelvo dos veces, entonces obtengo idéntico desenlace y eventos.

### Historia 3 (P2) — La apuesta de carril importa (mind-game)

Como jugador defensor, cuando acierto el carril del ataque, quiero una ventaja tangible; cuando fallo, una desventaja; para que anticipar tenga premio sin dominar el duelo.

**Aceptación:**
- Dado un duelo idéntico, cuando el defensor acierta el carril frente a cuando lo falla, entonces su fuerza efectiva difiere exactamente en 3 puntos (+2 vs −1).

### Casos límite

- Diferencia de fuerza muy grande: la banda de incertidumbre se ensancha (accidentes más memorables), pero nunca por debajo del suelo mínimo.
- Composure extrema (alta o baja): estrecha o ensancha la banda, con suelo garantizado.
- Resultado exactamente 0: desenlace "balón dividido" (el mini-duelo que desencadena queda fuera de esta feature; se emite un evento que lo señala).
- Técnica especial vs técnica especial: cuando ambos lados de `EntradaDeDuelo` traen `tecnicaEspecial` definido, el resolvedor aplica banda fija ±4. El catálogo de efectos específicos de cada técnica llega en features posteriores; v1 solo implementa el desvío de banda.

---

## Clarifications

### Session 2026-07-08

- Q: ¿Cuál es la API del PRNG sembrado que recibirá `resolverDuelo`? → A: Rng splittable inmutable como argumento
- Q: ¿Cómo modelar el punto de extensión para técnica especial en `EntradaDeDuelo`? → A: Campo opcional `tecnicaEspecial?: TecnicaEspecialId` en cada lado; v1 solo aplica banda fija ±4 cuando ambos lados lo traen
- Q: ¿Qué forma tiene el tipo `Evento` emitido por el resolvedor? → A: Discriminated union con `tipo` y payload tipado; solo las variantes necesarias en v1

### Sesión 2026-07-08 (resueltas contra el manual §6)

- **P: ¿Cómo se convierte un atributo 1-20 a influencia?** R: Tabla de compresión a −4..+4 (1-3→−4, 4-5→−3, 6-7→−2, 8-9→−1, 10-11→0, 12-13→+1, 14-15→+2, 16-17→+3, 18-20→+4).
- **P: ¿Cómo se aplican los modificadores situacionales?** R: Con rendimientos decrecientes sobre el bruto acumulado: puntos 1-4 al 100%, 5-8 al 50%, 9+ al 33%. Ejemplos: +6→+5, +8→+6, +10→+7.
- **P: ¿Qué entra como modificador y qué no?** R: SON mods (con decrecimiento): momentum, Technique, First Touch, Important Matches, estilo, rol, química, condiciones, presión acumulada. NO son mods (íntegros): potencia de carta, influencia de atributo, acierto/fallo de carril.
- **P: ¿Cómo influye el carril?** R: Defensor acierta → +2; falla → −1; swing 3; no entra en el tope de mods.
- **P: ¿Qué distribución tiene la incertidumbre?** R: Triangular −6..+6 centrada en 0. Banda dinámica según diferencia efectiva (0-4→±6, 5-6→±7, 7+→±8). Composure ajusta (15-17→−1, 18-20→−2, <8→+1). **Suelo mínimo ±3.**
- **P: ¿Cuál es la secuencia del duelo?** R: (1) atacante elige carta+jugador+destino/carril; (2) instantes pre-revelado; (3) defensor elige carta+defensor+apuesta de carril; (4) revelado simultáneo; (5) efectos post-revelado que manipulan carril; (6) resolución.
- **P: ¿El resolvedor aplica el momentum?** R: No. Emite los eventos de momentum que la tabla indica (p. ej. +6 → evento "+1 atacante"), pero el sistema de momentum los consume en otra feature.
- **P: ¿Incluye el remate contra el portero?** R: No. Es la feature 002 (tabla de umbrales distinta).

---

## Requisitos

### Requisitos funcionales

- **RF-001** El sistema DEBE calcular la fuerza de cada lado como `potencia de carta + influencia de atributo + modificadores situacionales`, y sumar el efecto de carril a la fuerza de la defensa.
- **RF-002** El sistema DEBE convertir cada atributo 1-20 a influencia en el rango −4..+4 según la tabla de compresión del §6.
- **RF-003** El sistema DEBE aplicar los modificadores situacionales con rendimientos decrecientes (100%/50%/33%) sobre el bruto acumulado, sin tope duro.
- **RF-004** El sistema DEBE aplicar potencia de carta, influencia de atributo y efecto de carril de forma íntegra (sin rendimientos decrecientes ni tope).
- **RF-005** El sistema DEBE aplicar el efecto de carril: +2 a la defensa si acierta, −1 si falla.
- **RF-006** El sistema DEBE calcular `Diferencial = FuerzaAtaque − FuerzaDefensa` y `Resultado = Diferencial + incertidumbre`.
- **RF-007** El sistema DEBE muestrear la incertidumbre de una distribución triangular con banda dinámica (según diferencia efectiva), ajuste por Composure y suelo mínimo ±3.
- **RF-008** El sistema DEBE clasificar el `Resultado` en exactamente uno de los siete tramos de eslabón normal (Éxito aplastante ≥+6, Éxito limpio +3..+5, Avance forzado +1..+2, Balón dividido 0, Pérdida simple −1..−2, Pérdida con desventaja −3..−5, Contragolpe devastador ≤−6).
- **RF-009** El sistema DEBE emitir los eventos asociados al tramo resultante (avance, robo de carta, presión extra, evento de momentum, transición, etc.) sin aplicar por sí mismo sistemas externos (momentum, energía, fatiga).
- **RF-010** El sistema DEBE ser **determinista**: mismos inputs + mismo `Rng` ⇒ mismo `Resultado` y mismos eventos. Toda la aleatoriedad entra por un `Rng` **splittable e inmutable** pasado como argumento a `resolverDuelo(entrada, rng)`; la función consume derivados (`rng.split()`) sin mutar el original.
- **RF-011** El resolvedor NO DEBE leer tiempo real, red, DOM ni aleatoriedad global (vive en el núcleo puro).
- **RF-012** El sistema DEBE respetar la secuencia de duelo del §6, dejando previstos los puntos de extensión para instantes pre-revelado y efectos post-revelado de carril (aunque su catálogo llegue después).

### Entidades clave

- **EntradaDeDuelo** — carta y atributo clave de cada lado, carriles (destino elegido y apuesta), modificadores situacionales activos, banderas de contexto (Composure de los implicados), y un campo opcional `tecnicaEspecial?: TecnicaEspecialId` por lado (string opaco). La aleatoriedad llega vía el argumento `rng: Rng` (splittable, inmutable), no como campo de la entrada.
- **Rng** — interfaz del núcleo: `{ next(): number; split(): Rng }`. `next()` devuelve float 0..1; `split()` produce un hijo independiente sin mutar el padre. Definida en `packages/core`; sin implementación concreta en esta feature.
- **ResultadoDeDuelo** — el tramo resultante, el `Resultado` numérico, y la lista de eventos emitidos.
- **Evento** — discriminated union; solo las variantes necesarias en v1:
  - `{ tipo: 'avance'; lado: 'ataque' | 'defensa' }` — el portador avanza en la cadena.
  - `{ tipo: 'roboCarta'; lado: 'ataque' | 'defensa' }` — el lado indicado roba una carta.
  - `{ tipo: 'momentum'; lado: 'ataque' | 'defensa'; delta: number }` — señal de cambio de momentum (la aplica el sistema de momentum, no el resolvedor).
  - `{ tipo: 'transicion' }` — cambio de posesión.
  - `{ tipo: 'miniDuelo' }` — resultado 0 (balón dividido); la lógica del mini-duelo llega en feature posterior.
  - Variantes adicionales se añaden en features futuras sin romper los consumidores de v1.

---

## Criterios de éxito (medibles, agnósticos de tecnología)

- **CE-001 (determinismo):** el 100% de las resoluciones repetidas con la misma semilla producen resultado y eventos idénticos.
- **CE-002 (calibración, vía harness):** en simulación masiva, un atacante élite (+4) frente a un defensor mediocre (−1) tiene éxito en el **80-85%** de los duelos; élite vs pésimo 90-95%; bueno vs bueno ≈50%. (Ver skill `sim-harness`.)
- **CE-003 (equilibrio):** ningún componente domina por encima de ~33% del peso; el azar pesa ≈33%, la decisión del jugador ≈31% y la preparación ≈37%.
- **CE-004 (suelo de banda):** en ninguna combinación de Composure y diferencia la banda de incertidumbre baja de ±3.
- **CE-005 (cobertura):** todo `Resultado` posible cae en exactamente un tramo, sin huecos ni solapes.

---

## Suposiciones y fuera de alcance

**Suposiciones:** el catálogo de cartas y los atributos de los jugadores ya existen como datos (o se usan dobles de prueba); el PRNG sembrado *splittable* está disponible en el núcleo.

**Fuera de alcance (features futuras):** remate contra el portero (002), aplicación del momentum/energía/fatiga, mini-duelo de balón dividido, cadena de posesión completa, IA rival, y el catálogo de instantes/técnicas especiales (esta feature solo deja los puntos de extensión).