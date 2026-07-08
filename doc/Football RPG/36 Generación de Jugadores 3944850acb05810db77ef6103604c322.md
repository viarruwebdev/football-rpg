# 36. Generación de Jugadores

# Algoritmo de generación de jugadores

Todo jugador (plantilla inicial, canterano, newgen del draft) se genera con este algoritmo. Traduce PA + posición + rol en atributos concretos.

## Pasos

```
1. Asignar posición (aleatoria ponderada por necesidades de plantilla)
2. Asignar rol compatible con la posición (aleatorio entre los válidos)
3. Determinar PA (campana de Gauss para canteranos, o nivel para plantillas)
4. Determinar edad
5. Determinar CA inicial (% del PA según edad, ver tabla)
6. Calcular presupuesto de atributos derivado de la CA
7. Repartir según pesos del rol (50/30/15/5) con coste cuadrático
8. Aplicar dispersión aleatoria (±2-3 puntos, CA constante) para variación
9. Generar atributos ocultos por separado (aleatorio, NO consume CA)
10. Asignar 2-4 rasgos (sistema de tres vías, sección 18)
11. Asignar nacionalidad (aleatoria, afecta química por idioma)
```

---

# Conversión de CA a atributos

**CA es la suma ponderada de atributos con coste cuadrático.** Cada punto de atributo por encima de la base cuesta CA de forma creciente: subir de 17 a 18 cuesta mucho más que subir de 10 a 11. Esto hace que los atributos élite (17+) sean caros y raros, replicando FM (un 18 vale mucho más que dos 14).

Fórmula aproximada:

```
CA ≈ Σ (valor_atributo² × peso_del_atributo_según_rol)
```

Un jugador con CA alta puede permitirse varios atributos altos. Uno con CA baja tiene todo mediocre.

## Reparto por pesos del rol

Los mismos pesos que el entrenamiento (coherencia generación ↔ desarrollo):

- 50% del presupuesto → atributos prioritarios del rol
- 30% → secundarios
- 15% → posición
- 5% → resto

Así un Delantero Goleador generado tiene la CA concentrada en Finishing/Off The Ball/Composure/Heading y muy poco en Tackling.

## Dispersión para variación

Tras el reparto, se mueven ±2-3 puntos entre atributos manteniendo la CA constante. Así dos delanteros con CA 120 salen distintos: uno "Finishing 17 / Pace 12" (definidor), otro "Finishing 14 / Pace 16" (veloz). Variedad dentro de la misma posición.

---

# Edad y % de PA alcanzado

La edad determina qué porcentaje del PA ya se ha convertido en CA al generar:

| Edad | CA/PA (% del PA alcanzado) |
| --- | --- |
| 15-17 | 25-40% |
| 18-20 | 40-60% |
| 21-23 | 60-80% |
| 24-28 | 80-100% (pico) |
| 29-31 | 90-100% (pico, físicos empezando a declinar) |
| 32+ | 85-100% pero con físicos ya declinados |

Los veteranos vienen "hechos" (CA cerca del PA). Los jóvenes vienen "verdes" (mucho margen de desarrollo).

---

# Atributos ocultos

Los atributos ocultos (Consistency, Injury Proneness, Important Matches, Temperament, Professionalism, Ambition, Loyalty, etc.) se generan **por separado, aleatoriamente, sin consumir CA.** Así un jugador puede tener CA 150 (excelente) pero Consistency 6 (irregular) o Injury Proneness 17 (frágil). Los ocultos son la sorpresa que el ojeador revela.

---

# Roles al generar

Cada jugador se genera con un **rol ya asignado** compatible con su posición. El jugador humano puede **cambiar el rol** (con periodo de adaptación de 4-6 semanas de entrenamiento reducido, según sección 17). Los atributos del jugador pueden encajar mejor o peor en el nuevo rol.

---

# Nombres y nacionalidades

**Liga multinacional.** Los jugadores se generan con nacionalidades variadas de un pool amplio. La nacionalidad afecta a la química: jugadores de misma nacionalidad ganan +0.5/mes de química, mismo idioma (distinta nacionalidad) +0.25/mes.

**Nombres ficticios generados aleatoriamente** tanto para franquicias (combinaciones tipo adjetivo/material + animal/concepto: Iron Hawks, Steel Wolves, Golden Lions) como para jugadores (nombre + apellido según su nacionalidad generada).

**Todo es aleatorio:** nombre de franquicia, colores, plantilla, staff, cantera. El jugador puede personalizar nombre y colores solo con desbloqueos de Legado (sección 27).