# Requirements Checklist: Economía de cartas (spec 005)

**Purpose**: Valida la calidad de los requisitos escritos, con foco en los cinco umbrales del portero, las siete filas de la tabla de reconversión/improvisación, el destino de las cartas (jugada vs descartada) y la verificabilidad con grep de CE-012/CE-013.
**Created**: 2026-07-10
**Feature**: `specs/005-economia-cartas/spec.md`

---

## Portero — umbrales y comportamiento (RF-013, RF-014, RF-015)

- [x] CHK001 - ¿Están los cuatro umbrales de atributo del portero (Handling ≥13, Aerial Reach ≥15, Reflexes ≥15, One on Ones ≥17) especificados como valores numéricos exactos, no como rangos ni como "alto"? [Claridad, Spec RF-015]
- [x] CHK002 - ¿Están los cuatro nombres de carta superior del portero (Blocaje, Despeje de puños, Estirada, Achique) y su potencia (4, 4, 5, 6) especificados de forma explícita en la spec, no solo en las Clarifications? [Completitud, Spec RF-015]
- [x] CHK003 - ¿Está especificado cuántas cartas superiores componen el set en total (cuatro superiores + Parada básica = cinco cartas) para que un implementador sepa exactamente el tamaño de `GoalkeeperSet.available`? [Claridad, Spec RF-014/RF-015]
- [x] CHK004 - ¿La regla "un uso por posesión" de las superiores está redactada de forma que se pueda comprobar unitariamente con una sola aserción (si la carta está en `usedThisPossession`, devuelve null)? [Medibilidad, Spec RF-015, CE-008]
- [x] CHK005 - ¿Está especificado qué ocurre si el portero no alcanza ningún umbral (solo dispone de Parada básica)? ¿Y si alcanza todos los cuatro? [Cobertura de casos límite, Spec RF-013/RF-015]
- [x] CHK006 - ¿El requisito de "regeneración completa al inicio de cada posesión defensiva" (RF-013) define qué se entiende por "completa" — que `usedThisPossession` se vacía y `available` vuelve a contener todas las cartas que el portero puede usar según sus atributos? [Claridad, Spec RF-013]

---

## Tabla de reconversión e improvisación (RF-016, RF-017, RF-018)

- [x] CHK007 - ¿La tabla de atributos por zona de improvisación (Passing en Defensa/Medio, Crossing o Finishing/Long Shots en Ataque, Finishing en Área, Tackling en defensa) cubre las siete combinaciones de zona×fase que el motor puede encontrar? [Completitud, Spec RF-016]
- [x] CHK008 - ¿Está resuelto el caso "Crossing o Finishing/Long Shots en Ataque" — es decir, qué criterio decide cuál de los dos atributos usa `improviseCard` para una zona de ataque? [Ambigüedad, Spec RF-016]
- [x] CHK009 - ¿La fórmula de reconversión (`floor(potencia / 2)`) está especificada con suficiente precisión para distinguir el caso de potencia impar (potencia 3 → 1, no 1.5) sin ambigüedad de redondeo? [Claridad, Spec RF-017]
- [x] CHK010 - ¿Está especificado que el atributo de la carta reconvertida es el de la **fase actual** (no el `atributoClave` de la carta), con un ejemplo concreto que lo ilustre (p.ej. carta con atributoClave "Dribbling" reconvertida en fase de defensa usa "Tackling")? [Claridad, Spec RF-017, CE-006]
- [x] CHK011 - ¿El requisito RF-018 ("potencia 1 no reconvertible") especifica qué forma toma el rechazo — lanza una excepción, devuelve `null`, devuelve un error tipado? [Claridad, Spec RF-018, CE-007]
- [x] CHK012 - ¿Están diferenciados en la spec los tres caminos de "jugar sin carta" (improvisación, reconversión, instante) de forma que ninguno pueda confundirse con otro en la implementación — p.ej. que improvisar no consume carta y reconvertir sí? [Consistencia, Spec RF-016/RF-017/RF-019]
- [x] CHK013 - ¿La frase "dominada por improvisar" de RF-018 es la única justificación del rechazo de potencia 1, o existe un criterio numérico explícito (reconvertida ≤ 0 ó efectivePower == 0) que el implementador pueda verificar sin interpretar la intención de diseño? [Claridad, Spec RF-018]

---

## Destino de las cartas: jugada vs descartada (RF-004, RF-005, RF-019)

- [x] CHK014 - ¿Define la spec exactamente los tres destinos posibles de una carta (sale del juego / vuelve al fondo de su sub-mazo / permanece en mano) y cuándo se aplica cada uno, de modo que no haya solapamiento? [Completitud, Spec RF-004/RF-005]
- [x] CHK015 - ¿Está especificado que "sale del juego" no significa ninguna estructura de datos (ni pila de descartes ni mazo de descarte) — simplemente la carta desaparece del sistema de economía y no es accesible para ninguna operación posterior? [Claridad, Spec RF-004]
- [x] CHK016 - ¿La spec indica qué sub-mazo es el "correspondiente" al que vuelve una carta descartada — es decir, que una carta `attack` descartada va al fondo del `attack` SubDeck y no del `shared`? [Claridad, Spec RF-005]
- [x] CHK017 - ¿El requisito RF-019 sobre instantes ("sale del juego, RF-004 aplica sin excepción") está redactado de forma que un implementador no necesite leer las Clarifications para saber que un instante no vuelve al fondo del mini-mazo? [Completitud, Spec RF-019]
- [x] CHK018 - ¿Están cubiertos en la spec los tres momentos en que una carta puede descartarse (exceso de mano, mulligan, sin mencionar ningún otro camino que no esté en scope)? [Consistencia, Spec RF-005/RF-009/RF-011]
- [x] CHK019 - ¿La regla de destino es consistente entre RF-004, RF-005, RF-019 y las Clarifications — ninguna de estas secciones contradice a las otras sobre si una carta "vuelve al fondo" o "sale del juego"? [Consistencia, Spec RF-004/RF-005/RF-019]

---

## Verificabilidad con grep — CE-012 y CE-013

- [x] CHK020 - ¿CE-012 ("no reimplementa nada de 001/002/003/004, verificable con grep") especifica los términos de grep concretos que un agente debe buscar — p.ej. `triangular`, `computeBand`, umbral `-6`/`+6` — o deja "grep" sin concretar, obligando a inferir qué buscar? [Medibilidad, Spec CE-012]
- [x] CHK021 - ¿CE-013 ("git diff no muestra cambios en `resolveDuel.ts` ni `resolveShot.ts`") es un criterio auto-contenido que se puede ejecutar sin interpretar otros requisitos, y está la ruta exacta de los archivos especificada en el CE? [Claridad, Spec CE-013]
- [x] CHK022 - ¿La spec aclara que CE-013 no puede verificarse con Vitest (requiere acceso a git = I/O = no determinista en core) y señala explícitamente dónde vive esta comprobación (checklist/CI, no test unitario)? [Completitud, Spec CE-013, research.md D2]
- [x] CHK023 - ¿CE-012 y CE-013 son mutuamente excluyentes — CE-012 prueba que el código del módulo `cards/` no copia la lógica de resolución, y CE-013 prueba que los archivos de resolución no se editaron — de modo que juntos cubren ambas direcciones del invariante "reutilización sin toque"? [Consistencia, Spec CE-012/CE-013]

---

## Cobertura general de criterios de éxito

- [x] CHK024 - ¿Cada CE de la spec (CE-001 a CE-014) tiene al menos un RF correspondiente, de modo que la trazabilidad es completa en ambas direcciones? [Trazabilidad, Spec §Criterios de éxito]
- [x] CHK025 - ¿CE-014 ("bandas de calibración intactas") especifica qué harness ejecutar, cuáles son las bandas numéricas exactas (2.82 goles/partido, [2.0, 4.5]) y qué significa "dentro de rango" para que la verificación no sea subjetiva? [Medibilidad, Spec CE-014]

## Notes

- Check items off as completed: `[x]`
- CHK006, CHK008, CHK011, CHK013, CHK020 resueltos en sesión 2026-07-10 (correcciones al §3 del manual, RF-016, RF-018, CE-012 y data-model).
- CHK001-005 resueltos 2026-07-13: tabla completa subida al cuerpo de RF-015 (nombres, umbrales, potencias, total 5, caso sin umbral, usedThisPossession).
- CHK009, CHK010, CHK012 resueltos 2026-07-13: RF-017 con Math.floor y ejemplo Dribbling→Tackling; párrafo de distinción de tres caminos antes de RF-016.
- CHK014-019 marcados 2026-07-13: cubiertos por RF-004/005/009/011/019 ya existentes.
- CHK021-025 marcados 2026-07-13: meta-criterios de verificación aceptados como riesgo; se resuelven al escribir los tests.
- Items son numerados de CHK001 en adelante para referencia en `/speckit-tasks`.
