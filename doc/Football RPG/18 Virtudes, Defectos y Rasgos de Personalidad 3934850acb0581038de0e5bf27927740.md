# 18. Virtudes, Defectos y Rasgos de Personalidad

# Principios del sistema

Cada jugador tiene 2-4 rasgos. Al menos 1 virtud y 1 defecto. Los rasgos son etiquetas visibles con efectos mecánicos concretos que el jugador humano puede leer y planificar. Son la personalidad hecha jugabilidad.

Los rasgos NO son los atributos ocultos: los atributos ocultos son números que afectan al motor internamente. Los rasgos son la capa visible que el jugador gestiona. Un jugador puede tener Professionalism 16 (número oculto) Y el rasgo "Profesional" (efecto visible), o tener Professionalism 16 sin el rasgo. Máximo 5 rasgos por jugador.

---

# Sistema de adquisición de rasgos (tres vías)

## Vía 1: Rasgos innatos (generación del jugador)

Al generarse (canterano, fichaje, jugador inicial), recibe 2-4 rasgos ponderados por atributos pero NO automáticos. Un jugador con Composure 16 tiene ~60% de probabilidad de recibir "Sangre fría", no 100%. Permite sorpresas: jugadores modestos con rasgos brillantes, cracks con defectos inesperados. El scouting importa porque no puedes deducir rasgos solo de los números.

## Vía 2: Rasgos ganados por eventos

Se desbloquean cuando ocurre un evento específico. Sistema: evento elegible → verificación de requisitos mínimos de atributos → tirada de probabilidad ponderada.

**Acumulación:** los eventos elegibles que fallan la tirada dejan una "semilla" que sube la probabilidad (+10% acumulativo) de la siguiente tirada del mismo tipo. Un jugador que falla 3 penaltis en partidos importantes acumula probabilidad de ganar "Fantasma" en cada fallo. No es automático al primer fallo, pero la acumulación hace que eventualmente el rasgo se forme si el patrón se repite.

Ejemplos: marcar el gol del ascenso (40% de "Jugador de las grandes citas" si Important Matches 12+ y Composure 12+). Canterano debuta con nota >7 (30% de "Madurez precoz" si Professionalism 11+ y Determination 12+). 2 temporadas sin subir CA (50% de "Estancado" si Professionalism <10 y Ambition <10).

La agencia del jugador humano está en crear las condiciones (poner al canterano en partidos grandes); el resultado tiene incertidumbre. Tensión roguelite perfecta.

## Vía 3: Rasgos de umbral (automáticos)

Pequeño grupo que se otorga/pierde automáticamente al cruzar umbrales de atributos. Representan capacidades físicas/técnicas objetivas, no personalidad.

Rasgos de umbral: Velocista explosivo (Acc 17+, Pace 16+), Cañonero (LS 16+, Tech 15+, Str 14+), Motor incansable (Sta 16+, WR 16+, NF 15+), Intocable (Agi 17+, Bal 16+, Dri 15+), Regateador nato (Dri 17+, Bal 15+, Agi 15+), Cristal (IP 15+), Pies de plomo (Agi <8 Y Pace <8), Cuerpo frágil (NF <8). Se pierden automáticamente al bajar del umbral.

## Resumen de adquisición

| Tipo | Cómo se adquiere | Cómo se pierde | Ejemplos |
| --- | --- | --- | --- |
| Innato | Al generarse, ponderado por atributos | Por eventos contrarios o transformación | Sangre fría, Profesional, Diva, Líder nato |
| Por evento | Evento + requisitos + tirada con acumulación | Por eventos contrarios o transformación | Jugador de las grandes citas, Fantasma, Ídolo local |
| De umbral | Automático al cruzar umbral | Automático al bajar del umbral | Velocista explosivo, Cañonero, Cristal |

---

# Evolución de rasgos

Los rasgos NO son permanentes de por vida.

**Ganar un rasgo:** por eventos narrativos, logros o circunstancias. Máximo 5 rasgos por jugador (si ya tiene 5, un rasgo nuevo reemplaza al más débil o al que el evento contradiga).

**Perder un rasgo:** eventos negativos o paso del tiempo. "Jugador de las grandes citas" que falla un penalti en la final puede perderlo. "Veloz" que envejece pierde el rasgo cuando Pace baja del umbral.

**Transformación:** algunos rasgos evolucionan. "Promesa" → "Consolidado" (cumplió potencial) o "Promesa incumplida" (no llegó). "Ambicioso" → "Líder natural" (con capitanía) o "Descontento crónico" (sin jugar).

---

# RASGOS DE PARTIDO

Afectan directamente al motor de duelos y cartas.

## Virtudes de partido

**Sangre fría** — En el descuento o con <8 jugadas, todas sus cartas ganan +1 potencia. Req: Composure 15+, Pressure 14+.

**Jugador de las grandes citas** — En partidos clave, todos sus atributos ganan +1 de influencia. Req: Important Matches 15+ o evento narrativo.

**Clutch** — Cuando el equipo va perdiendo, sus cartas de Tiro ganan +1 potencia. Req: Determination 16+, Bravery 15+.

**Motor incansable** — Umbral de fatiga +3. Puede jugar partidos seguidos sin rotar. Req: Stamina 16+, Work Rate 16+, NF 15+. (Umbral)

**Instinto asesino** — Cuando remata en el Área, resultado "gol con rebote" (+1/+2) se convierte en "gol" (+3/+4). Req: Finishing 16+, Composure 15+.

**Lectura del juego** — 1 vez por partido, puede ver la carta del rival antes del revelado (gratis, sin energía). Req: Anticipation 17+, Decisions 16+.

**Velocista explosivo** — En los primeros 2 eslabones de cada posesión, Pace cuenta doble (Pace/2 en vez de Pace/4). Req: Acceleration 17+, Pace 16+. (Umbral)

**Intocable** — Cuando conduce/regatea, 40% de esquivar faltas de Barrida/Entrada completamente. Req: Agility 17+, Balance 16+, Dribbling 15+. (Umbral)

## Defectos de partido

**Cristal** — Al perder duelo por -4 o peor, verificación de lesión con +15% extra. Req: Injury Proneness 15+. (Umbral)

**Fantasma** — En partidos clave, todos sus atributos pierden -1 de influencia. Req: Important Matches <8 o evento (fallo traumático).

**Nervioso** — En el descuento o con <8 jugadas, sus cartas pierden -1 potencia. Req: Pressure <8.

**Precipitado** — Al jugar cartas de Regate, banda de varianza se ensancha +1. Req: Decisions <9, Flair 14+.

**Cobarde** — No puede jugar Cabezazo. En divididos, siempre cede automáticamente. Req: Bravery <7.

**Pies de plomo** — Cambios de carril cuestan 2 jugadas en vez de 1. Req: Agility <8 Y Pace <8. (Umbral)

**Desconcentrado** — A partir de jugada 40, cada 3 eslabones 15% de -2 potencia automático. Req: Concentration <9.

---

# RASGOS DE DESARROLLO

Afectan a cómo crece el jugador.

## Virtudes de desarrollo

**Profesional** — +15% velocidad de desarrollo. Atributos nunca bajan más de -0.5/temporada en declive. Req: Professionalism 16+.

**Esponja** — Atributos técnicos crecen +20% más rápido. Req: generado al azar en jugadores <19.

**Madurez precoz** — Mentales empiezan a crecer desde los 18 (en vez de 23). Req: jugador 16-18 que debuta en primer equipo con nota >7.

**Genética privilegiada** — NF efectivo +3 para cálculos de declive. Req: NF 17+ al generarse.

**Talento tardío** — Si a los 25 tiene gap PA-CA de 20+, velocidad de desarrollo x2 durante 2 temporadas. Req: generado al azar con PA alto y desarrollo lento.

## Defectos de desarrollo

**Perezoso** — -15% velocidad de desarrollo. Si no juega 15+ partidos/temporada, pierde -1 atributo aleatorio. Req: Professionalism <8, Work Rate <9.

**Estancado** — Si CA no sube en 6 meses, pierde -1 PA permanente. Req: Ambition <8.

**Cuerpo frágil** — Físicos empiezan a declinar 2 años antes de lo normal. Req: NF <8. (Umbral)

**Techo bajo** — Técnicos nunca superan 16. Puede ser sólido pero nunca crack técnico. Req: generado al azar en % de canteranos.

---

# RASGOS DE VESTUARIO

Afectan a moral, química y gestión.

## Virtudes de vestuario

**Líder nato** — +2 chemistry con TODOS. Si es capitán, Arenga sube a +2/+3 potencia. Req: Leadership 17+, Teamwork 14+.

**Pegamento del grupo** — Reduce -2 la penalización de moral baja de compañeros. Estabiliza el vestuario. Req: Teamwork 17+, Leadership 14+.

**Modesto** — Acepta ser suplente sin penalización moral. Nunca rechaza la retención. Req: Ambition <8, Loyalty 15+.

**Veterano sabio** — Jugadores <21 que juegan con él ganan +5% velocidad desarrollo. Mentor natural. Req: edad 30+, Leadership 14+, Teamwork 14+, Professionalism 14+.

**Ídolo local** — Si lleva 5+ temporadas: +3 chemistry con TODOS, +1 momentum extra en casa. Req: Loyalty 16+, 5+ temporadas.

## Defectos de vestuario

**Diva** — Exige ser titular. Si no juega 2 partidos seguidos: moral -2, moral vestuario -1. Aumenta mucho su probabilidad de rechazar la retención. Req: Ambition 17+, Loyalty <8.

**Tóxico** — -1 chemistry con TODOS. Conflicto con otro jugador baja moral del grupo -1. Req: Controversy 15+, Teamwork <8.

**Mercenario** — Si otra franquicia tiene mejor ranking global que la tuya, su probabilidad de rechazar la retención sube +30%. Req: Loyalty <6, Ambition 15+.

**Vestuario dividido** — Si este jugador y otro "Tóxico"/"Diva" están en la plantilla, 15%/temporada de conflicto abierto (moral grupo -2). Req: Temperament <8.

**Influencia negativa** — Jugadores <21 que juegan con él: -5% desarrollo, 10%/temporada de ganar rasgo negativo. Req: Professionalism <7, Controversy 14+.

---

# RASGOS DE ESTILO

Afectan a cartas que aporta y cómo aparece en el campo.

## Virtudes de estilo

**Jugador de área** — +25% aparición en Área. Tiros en Área +1 potencia. Req: Off The Ball 16+, Finishing 14+, Anticipation 15+.

**Organizador** — +20% aparición en Medio. Pase corto exitoso: siguiente eslabón -1 presión acumulada. Req: Passing 15+, Vision 14+, Teamwork 14+.

**Todocampista** — Aparece en pools de TODAS las franjas (ignora restricciones de posición). Req: Work Rate 17+, Stamina 16+, Versatility 15+.

**Depredador** — En Tiros, si resultado es "paradón" (0), 25% de rebote jugable. Req: Off The Ball 16+, Anticipation 16+, Finishing 14+.

**Defensor implacable** — Al ganar 2 duelos defensivos consecutivos en la misma posesión, el 3º tiene +1 potencia automático. Req: Tackling 16+, Concentration 15+, Determination 15+.

**Regateador nato** — Regates nunca peor que "pérdida simple" (protección contra contragolpes devastadores). Req: Dribbling 17+, Balance 15+, Agility 15+. (Umbral)

**Cañonero** — Disparos lejanos desde Ataque: -1 penalización en vez de -3. Req: Long Shots 16+, Technique 15+, Strength 14+. (Umbral)

## Defectos de estilo

**Previsible** — Defensores rivales ganan +1 Marking contra él. Req: Flair <8.

**Reacio al gol** — No puede jugar cartas de Tiro salvo Disparo lejano. Si es la única opción en Área, solo puede pasar o regatear. Req: Finishing <6, Composure <8.

**Lento en la transición** — No aparece en pools de contragolpe. Solo en ataques posicionales. Req: Anticipation <9, Pace <10.

**Unidimensional** — Solo puede jugar cartas de un tipo (pases O regates, el de mayor atributo). Req: diferencia Passing vs Dribbling de 8+.

---

# Interacción con otros sistemas

**Con potencial dinámico:** "Profesional" hace más probable +PA. "Perezoso" hace más probable -PA. "Esponja" multiplica efecto de +PA en jóvenes.

**Con química:** rasgos de vestuario positivos suman chemistry, negativos la restan. Dos "Líder nato" pueden chocar o complementarse según Teamwork mutuo.

**Con eventos narrativos:** rasgos son detonadores. "Diva" genera conflictos. "Ídolo local" genera eventos de afición. "Talento tardío" genera sorpresa al florecer.

**Con retención y draft:** "Mercenario" y "Diva" suben la probabilidad de rechazo. "Modesto" e "Ídolo local" la eliminan o reducen. Los rasgos de vestuario son la palanca principal de la retención (no hay salarios; ver sección 24).

## Volumen total de rasgos

~50-55 rasgos únicos (8-10 virtudes de partido, 6-8 defectos de partido, 5-6 virtudes de desarrollo, 4-5 defectos de desarrollo, 5-6 virtudes de vestuario, 5-6 defectos de vestuario, 6-8 virtudes de estilo, 4-6 defectos de estilo). Con 2-4 rasgos por jugador de un pool de 50, cada canterano o fichaje tiene personalidad propia.