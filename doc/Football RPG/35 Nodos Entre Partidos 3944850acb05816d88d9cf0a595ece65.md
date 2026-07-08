# 35. Nodos Entre Partidos

# Estructura semanal: 4 nodos entre partidos

Cada semana entre partidos tiene 4 nodos que el jugador recorre en orden, como un mapa de Slay the Spire. 2 fijos + 2 variables.

```
[PARTIDO] → Recuperación → Entrenamiento → Evento/Actividad → Preparación → [PARTIDO]
```

---

# Nodo 1 — Recuperación (fijo, informativo)

Estado de la plantilla tras el partido anterior:

- Lesiones nuevas y duración
- Niveles de fatiga de cada jugador
- Cambios de moral
- Recompensa post-partido elegida (recordatorio)
- Racha del equipo

Sin decisión: es informativo. Preparas mentalmente la semana.

---

# Nodo 2 — Entrenamiento (fijo, con decisión)

El nodo obligatorio donde los atributos suben. Cada semana eliges **1 enfoque de entrenamiento para TODA la plantilla** entre las opciones disponibles. Solo el grupo elegido progresa al 100%, los demás al 25%. Esto crea coste de oportunidad real: lo que no entrenas apenas avanza.

## Opciones de entrenamiento semanal

**Entrenamiento ofensivo** — Delanteros y mediapuntas progresan al 100%. Defensas y portero al 25%.

**Entrenamiento defensivo** — Defensas y portero al 100%. Delanteros y mediapuntas al 25%.

**Entrenamiento físico** — Todos los atributos físicos al 100%. Técnicos y mentales al 25%.

**Entrenamiento táctico** — Todos los atributos mentales al 100%. Físicos al 25%.

**Entrenamiento de equipo** — Nadie progresa en atributos pero química grupal +3.

Con ~30 semanas por temporada, la distribución de tus sesiones define cómo evoluciona tu equipo. Si siempre entrenas ofensivo, tus delanteros son monstruos pero tu defensa se estanca. Decisión de 5 segundos por semana con impacto real.

## Foco individual (adicional)

Además del enfoque grupal, puedes asignar **1 foco individual** a 1 jugador: un atributo específico que gana +3-5% extra esta semana. Solo 1 jugador por semana.

---

# Nodo 3 — Evento / Actividad (variable, con decisión)

Se genera al azar 1 de 3 tipos:

## Evento del catálogo (40%)

Uno de los ~75 eventos de la sección 26 (mayor o menor). Con sus opciones y consecuencias según probabilidades de disparo.

## Actividad opcional (35%)

Elige 1 entre 2-3 actividades generadas al azar del siguiente pool:

**"Sesión extra de entrenamiento"** — 1 jugador recibe +50% progresión esta semana. Pero +1 fatiga.

**"Día de descanso colectivo"** — Toda la plantilla recupera 1 nivel fatiga. Progresión de la semana baja 50% para todos.

**"Partido amistoso interno"** — 2-3 suplentes ganan +25% progresión. Un canterano gana medio partido de desarrollo (+4 CA). 5% lesión leve por participante.

**"Vídeo del rival"** — +1 nivel info del rival gratis (sin gastar informe ojeador). Pero progresión de la semana -30%.

**"Reunión de vestuario"** — 60% moral grupo sube 1 escalón. 20% sin efecto. 20% sale mal (-1 moral a 2-3 jugadores).

**"Trabajo con canteranos"** — 1-2 canteranos ganan +3 CA inmediato (+1 inyección de 30% ×3). Entrenamiento primer equipo -25%.

**"Sesión de tiros"** — Delanteros y mediapuntas: +25% extra en Finishing y Long Shots. Defensas y portero no se benefician.

**"Sesión defensiva"** — Defensas y portero: +25% extra en Tackling, Positioning, Reflexes. Atacantes no se benefician.

**"Sesión de química"** — Todos los pares ganan +3 química. Progresión de atributos esta semana = 0%.

**"Ojeador interno"** — Revela PA real + 1 rasgo oculto de 1 jugador de tu plantilla. No gasta informe. Pero ojeador no puede estudiar al rival esta semana.

**"Concentración táctica"** — Próximo partido incluye 1 carta "Jugada ensayada" (potencia 4, 1 uso). Progresión -15%.

**"Descanso selectivo"** — 3 jugadores descansan completamente: fatiga a 0, +0.5 moral. No progresan ni juegan el próximo partido.

**"Sesión de balón parado"** — Cartas de balón parado +1 potencia en próximo partido. Corners, FK Taking y Penalty Taking ganan +15% progresión.

**"Charla individual"** — Charla privada con 1 jugador. Opciones según su estado (moral, rasgos, rendimiento). Es la charla del sistema de moral posicionada como nodo.

## Semana tranquila (25%)

No pasa nada. La calma entre tormentas. El jugador avanza directamente al nodo 4.

---

# Nodo 4 — Preparación de partido (fijo, con decisión)

Pantalla de preparación pre-partido:

- Elige alineación (11 titulares + suplentes)
- Elige formación, estilo, instrucciones
- Ve el modificador de partido si lo hay
- Ve info del rival según nivel de conocimiento
- Puede gastar informe de ojeador para estudiar al rival
- Ve recomendaciones del preparador (fatiga, rotación)

---

# Ejemplo completo de una semana

```
═════════════════════════════════════════════════
SEMANA 14 | Temporada 2 | Ranking: 15/32 (seguro)
═════════════════════════════════════════════════

NODO 1 — RECUPERACIÓN
━━━━━━━━━━━━━━━━━━━━
Resultado anterior: Victoria 2-1 vs Dragones
Recompensa elegida: "+10 química entre Romero y Vidal"

Estado:
• Torres: lesión menor, 2 partidos fuera
• Romero: fatiga alta (12/14)
• Vidal: moral subió a Alto (gol)
• Racha equipo: 3 victorias

[Continuar →]

NODO 2 — ENTRENAMIENTO
━━━━━━━━━━━━━━━━━━━━━━
• Vidal (19, Del. Goleador):
  Finishing 13 [████████░░] 82%
  Off The Ball 12 [████░░░░░░] 41%

• Romero (22, Pivote Organizador):
  Passing 15 [██████░░░░] 63%

Decisión foco:
> Foco Finishing a Vidal (+5%, llega a 14)
> Foco Passing a Romero (+5%)
> Sin foco especial

Elección: Foco a Vidal.
¡Finishing sube de 13 a 14! Desbloquea "Tiro colocado".

[Continuar →]

NODO 3 — ACTIVIDAD
━━━━━━━━━━━━━━━━━━━
[Generado: Actividad opcional]

Elige 1:
> Partido amistoso interno
  Suplentes +25%. Canterano +4 CA. 5% lesión.
> Sesión de química
  +3 química todos los pares. Sin progresión.
> Sesión extra a Romero
  +50% progresión Romero. +1 fatiga.

Elección: Partido amistoso interno.
García (suplente) +25% Tackling.
Canterano López +4 CA. Sin lesiones.

[Continuar →]

NODO 4 — PREPARACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Próximo: vs Fénix (Suizo ronda 5)
Modificador: "Calor sofocante" (fatiga +50%)

Info rival (3ª vez):
• Formación: 4-2-3-1
• Estilo: Posesión
• Jugador clave: "Rashid" (★★★★)

Preparador recomienda rotar a Romero.
¿Gastar informe ojeador? [Sí / No]

Elegir alineación e instrucciones...

[Jugar partido →]
```

---

# Resumen

| Concepto | Regla |
| --- | --- |
| Estructura | 4 nodos: Recuperación → Entrenamiento → Evento/Actividad → Preparación |
| Nodos fijos | Recuperación (informativo) + Entrenamiento (foco individual) |
| Nodo variable | Evento catálogo (40%) / Actividad opcional (35%) / Semana tranquila (25%) |
| Actividades | ~13 tipos con trade-offs claros |
| Progresión | Barra 0-100% por atributo, visible, sube según fórmula semanal |
| Foco | 1 jugador por semana puede recibir +3-5% extra en 1 atributo |

---

# Ejemplo completo: 3 semanas de nodos (Temporada 2, suizo rondas 3-5)

## Contexto

Franquicia: Thunder Hawks | Temporada 2 | Ranking: 19/32

Semilla: "Meta ofensivo" + "Química instantánea"

Condición arranque: "Los mellizos" (Romero y Vidal, centrales con química 70)

Récord suizo: 2-1 | Consumibles: 1 ficha ojeo, 1 comodín táctico

---

## SEMANA 11 (tras victoria 3-2 vs Fénix, suizo ronda 3)

**Nodo 1 — Recuperación:** Torres con fatiga 11/14, Romero 10/12. Méndez lesión menor (1 partido). Torres moral sube a Alto (doblete). Racha equipo: 2 victorias. Recompensa elegida: "+1 PA a Torres".

**Nodo 2 — Entrenamiento:** Vidal tiene Composure al 96%. Foco a Vidal Composure (+5%). ¡Composure sube de 15 a 16! Desbloquea rasgo "Sangre fría" (umbral automático). Torres Finishing al 78%, no sube aún.

**Nodo 3 — Actividad opcional:** Opciones: sesión extra Torres (+50% pero +1 fatiga), día descanso colectivo (fatiga -1, progresión -50%), partido amistoso interno (suplentes +25%, canterano +4 CA). Elección: día de descanso (Torres y Romero necesitan recuperar). Torres fatiga 11→10, Romero 10→9.

**Nodo 4 — Preparación:** Vs Dragones (ronda 4). Modificador: "Derbi local" (+1 momentum inicio). Info rival (2ª vez): 5-3-2 Catenaccio. No gasta informe ojeador (guarda para draft). Torres titular pese a fatiga (lo necesita contra catenaccio). García entra por Méndez (lesionado). 4-3-3 Juego por bandas, Línea alta + Tempo alto.

**Resultado:** Victoria 1-0. Racha partido: 7 (Torres "en la zona"). Torres +1 CA automático (racha 7). Recompensa (1 de 4, bonus racha): "+1 Finishing permanente a Torres" → sube de 15 a 16, desbloquea "Definición precisa".

---

## SEMANA 12 (tras victoria 1-0 vs Dragones, suizo ronda 4)

**Nodo 1 — Recuperación:** Méndez recuperado. Torres fatiga 12/14 (muy alta). Moral grupo: Alto (3 victorias). A 2 victorias del Championship.

**Nodo 2 — Entrenamiento:** García Tackling al 77%. López (canterano) Pace al 86%. Foco a García Tackling (+5%). ¡Tackling sube de 14 a 15! Desbloquea "Corte de línea".

**Nodo 3 — Evento del catálogo:** "Canterano pide oportunidades". López (17, ★★★, Ambition 15) pide jugar. Opciones: "Te voy a dar minutos" (compromiso 5+ partidos o pierde moral/PA) o "Espera tu momento" (20% de que rechace contrato a los 18). Elección: "Te voy a dar minutos". López moral sube a Alto. Compromiso: 0/5 partidos.

**Nodo 4 — Preparación:** Vs Titanes (ronda 5). Modificador: "Escaparate de canterano" (López juega + victoria = +5 CA y +2 PA). Info rival (1ª vez): solo alineación. Torres al banquillo (descansa, fatiga 12/14). López convocado como titular (partido 1/5 del compromiso + aprovecha modificador). 4-3-3 Posesión (jugar seguro con canterano).

**Resultado:** Victoria 2-0. López marcó su primer gol. Modificador: López gana +5 CA y +2 PA. Evento disparado (prob. 30%): ¡López gana rasgo "Madurez precoz"! Recompensa (1 de 3): "Revela PA real de López" → PA real: 158 (ojeador estimaba ★★★ = 110-140). ¡Es mucho mejor de lo que pensabas!

---

## SEMANA 13 (tras victoria 2-0 vs Titanes, suizo ronda 5)

**Nodo 1 — Recuperación:** Torres descansó, fatiga 10→8. López fresco (fatiga 3/10). Moral grupo: Eufórico (4 victorias). ¡A 1 victoria del Championship!

**Nodo 2 — Entrenamiento:** López Dribbling al 78%. Foco a López Dribbling (+5%). ¡Dribbling sube de 10 a 11! Desbloquea "Conducción".

**Nodo 3 — Semana tranquila:** No pasa nada. La calma antes del partido decisivo.

**Nodo 4 — Preparación:** Vs Legión (ronda 6). Modificador: "Partido bajo presión" (Pressure <10: -1 influencia, 15+: +1). Info rival (4ª vez): 4-2-3-1 Contragolpe letal, jugador clave "Okafor" (Pace 18), Línea baja + Contragolpe rápido. Decisión: usar comodín táctico (consumible) para cambiar a Pressing alto sin penalización de adaptación. Torres titular. López al banquillo (no arriesgar en partido decisivo). Romero-Vidal titulares (química 75, Complicidad).

**Resultado:** Victoria 2-1. Torres gol (min. 22). López entró min. 50, asistencia, cuenta como partido 2/5. ¡Clasificados al Championship! +8 Legado. Racha partido: 5. Recompensa (1 de 4): "+15 química Romero-Vidal" → química 75→90 = ¡TELEPATÍA! Desbloquean "Presión coordinada". +3 Legado.

## Estado al final de las 3 semanas

- Ranking: 12/32 (verde, seguro)
- Legado acumulado: 37
- Consumibles: 1 ficha ojeo (gastó comodín táctico)
- Clasificados al Championship
- López: 2/5 partidos del compromiso, PA real 158 descubierto, rasgo "Madurez precoz"
- Torres: Finishing subió de 15 a 16 (carta "Definición precisa")
- Vidal: Composure 16, rasgo "Sangre fría"
- García: Tackling 15 (carta "Corte de línea")
- Romero-Vidal: Telepatía (carta "Presión coordinada")
- Decisiones pendientes: promover a López antes de 5 partidos, rotar a Torres en playoffs, solo 1 consumible para playoffs