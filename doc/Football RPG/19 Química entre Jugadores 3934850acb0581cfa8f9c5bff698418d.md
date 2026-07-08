# 19. Química entre Jugadores

# Qué es la química mecánicamente

Cada par de jugadores tiene un valor de química entre 0 y 100. No es simétrica obligatoriamente: A puede tener 60 con B, pero B 55 con A. El valor en partido es el promedio de ambos.

| Rango | Etiqueta | Color |
| --- | --- | --- |
| 0-15 | Desconocidos | Gris |
| 16-30 | Conocidos | Blanco |
| 31-50 | Compañeros | Verde claro |
| 51-70 | Conexión | Verde |
| 71-85 | Complicidad | Azul |
| 86-100 | Telepatía | Dorado |

---

# Cómo se construye la química

## Factores que SUBEN

**Tiempo juntos en plantilla:** +1 por mes compartido. El goteo base que premia la estabilidad. 2 temporadas juntos = +24 solo por convivencia.

**Partidos jugados juntos:** +0.5 por partido como titulares. +0.5 extra por cada duelo donde participan en eslabones contiguos (uno pasa, otro recibe).

**Éxito compartido:** victoria donde ambos jugaron +1. Título ganado (liga, copa, ascenso) +3 a todos los pares que participaron en >50% de los partidos.

**Compatibilidad de rasgos:**

- Líder nato + Modesto: +1/mes
- Profesional + Profesional: +0.5/mes
- Veterano sabio + Esponja: +1.5/mes
- Pegamento del grupo + Cualquiera: +0.5/mes
- Líder nato + Líder nato: -0.5/mes (dos gallos)

**Teamwork:** cada punto de Teamwork por encima de 12 suma +0.5 de chemistry mensual con TODOS. TW 18 = +3/mes pasivo con todos.

**Nacionalidad/idioma compartido:** misma nacionalidad +0.5/mes. Mismo idioma (distinta nacionalidad) +0.25/mes.

**Posición complementaria:** +0.5/mes entre pares naturales:

- Extremo ↔ Lateral del mismo lado
- Mediapunta ↔ Delantero centro
- Pivote ↔ Central
- Extremo ↔ Delantero centro
- Los dos centrales entre sí

## Factores que BAJAN

**Conflictos de vestuario:** -10 a -20 de golpe. El daño más grave.

**Competencia por el puesto:** -1/mes si compiten por la misma posición y solo uno juega. No aplica si el suplente tiene rasgo "Modesto".

**Rasgos incompatibles:**

- Diva + Diva: -1.5/mes
- Tóxico + Cualquiera (sin Pegamento): -1/mes
- Mercenario + Ídolo local: -1/mes
- Influencia negativa + Profesional: -0.5/mes

**Derrota compartida:** derrota humillante (3+ goles) -0.5 entre todos los pares. Descenso -3 entre todos.

**Separación:** jugador cedido o vendido: -2/mes con excompañeros. Un año fuera = ~24 puntos perdidos.

**Transferencia conflictiva:** jugador que pide traspaso o fuerza salida: -5 inmediato con TODOS. Si se le retiene contra su voluntad: -2/mes adicional.

---

# Efectos en el partido

## 1. Probabilidad de carta de combinación

Cuando dos jugadores con química participan en eslabones contiguos:

| Nivel | Probabilidad |
| --- | --- |
| Desconocidos (0-15) | 0% |
| Conocidos (16-30) | 10% |
| Compañeros (31-50) | 25% |
| Conexión (51-70) | 45% |
| Complicidad (71-85) | 65% |
| Telepatía (86-100) | 85% |

## 2. Bonus de potencia por química

Independientemente de la carta combinada, el segundo jugador (receptor) gana bonus:

| Nivel | Bonus potencia |
| --- | --- |
| Desconocidos-Conocidos | 0 |
| Compañeros | +0.5 |
| Conexión-Complicidad | +1 |
| Telepatía | +2 |

## 3. Química defensiva

Dos defensores con química en el mismo pool defensivo:

- Compañeros a Conexión: acceso a "Cobertura en cadena"
- Complicidad a Telepatía: acceso a "Cobertura en cadena" + "Presión coordinada"

---

# Química de grupo

Además de pares, existe una química de equipo = promedio de todas las químicas entre los 11 titulares.

| Química media | Efecto global |
| --- | --- |
| 0-20 | -1 potencia a TODAS las cartas |
| 21-60 | Sin efecto (neutro) |
| 61-75 | +1 energía extra al inicio del partido |
| 76-100 | +1 energía extra + 1 carta adicional al inicio |

Incentiva mantener un bloque estable: un equipo de jugadores buenos que se conocen desde hace 3 temporadas puede superar a un equipo de estrellas recién fichadas. La tensión roguelite: ¿fichas al crack que mejora individualmente pero destruye la química, o mantienes al modesto que tiene Telepatía con medio equipo?

---

# La química como narrativa

La pareja de centrales que sube de Desconocidos a Telepatía en 5 temporadas. Vender a uno rompe algo que tardó años en construirse.

El fichaje estrella que llega con química 0. Los primeros meses es un crack aislado sin cartas combinadas; al final de temporada empieza a conectar.

El conflicto Diva vs Líder nato que destruye la química de grupo de 55 a 35 en un mes. La temporada se descarrila hasta que se resuelve vendiendo a uno.