# 34. Racha de Partido (FUSIONADA → ver Momentum en sección 7)

# Racha de partido

Contador que sube con cada duelo ganado consecutivamente. Premia encadenar éxitos con recompensa creciente. Push-your-luck dentro del partido.

---

# Mecánica

Cada duelo ganado suma +1 a la racha. Persiste entre posesiones (atacar y defender). Se puede construir y romper varias veces por partido.

## Qué rompe la racha

- **Pérdida de duelo (-1 o peor):** rompe la racha
- **Pérdida con desventaja (-3 a -5) o contragolpe devastador (-6):** rompe + penalizador -0.5 influencia durante 2 duelos
- **Balón dividido (0):** NO rompe la racha

---

# Bonus por nivel de racha

| Racha | Efecto durante el partido | Bonus post-partido |
| --- | --- | --- |
| 3 | Siguiente carta +1 potencia temporal | — |
| 5 | +1 potencia sostenido + roba 1 carta extra | +1 opción recompensa (elige 1 de 4 en vez de 1 de 3) |
| 7 | 1 jugador gana +1 influencia resto del partido ("en la zona") | Ese jugador gana +1 CA permanente |
| 10 | Se desbloquea carta "Jugada perfecta" (potencia 6, 1 uso) | +2 CA al más activo + recompensa mejorada automáticamente |

Racha de 10 es extremadamente rara. Cuando sucede, es un momento memorable.

---

# Múltiples rachas por partido

La racha se puede romper y reconstruir varias veces. Los **bonus post-partido se acumulan** entre rachas (2 rachas de 5 = +2 opciones extra en recompensa). Los **bonus intra-partido** (+1 potencia, "en la zona") se resetean al romper.

---

# Diferencia con momentum

|  | Momentum | Racha |
| --- | --- | --- |
| Qué es | Estado emocional del equipo | Fluidez técnica del momento |
| Qué lo mueve | Eventos significativos (goles, técnicas) | Cada duelo ganado |
| Persistencia | Se degrada lentamente | Se rompe instantáneamente al perder 1 duelo |
| Efecto | Fuerza en duelos (±0.5 por punto) | Potencia de cartas + recompensas post-partido |

Coexisten: puedes tener momentum +3 y racha 0, o momentum 0 y racha 6.

---

# Interacción con rasgos

- **Sangre fría:** en el descuento, la racha no se rompe con pérdida simple (-1/-2), solo con -3 o peor
- **Precipitado:** la racha se rompe con cualquier resultado negativo, incluso balón dividido
- **Defensor implacable:** duelos defensivos ganados cuentan doble (+2 en vez de +1)
- **Organizador:** pases cortos exitosos dentro de la racha regeneran +1 energía cada 3 eslabones