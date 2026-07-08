---
name: save-migrations
description: >-
  Cómo versionar y migrar de forma segura las partidas guardadas del Football RPG
  en IndexedDB (Dexie), protegiendo la integridad frente al permadeath. Úsala al
  cambiar el esquema de un save, añadir/renombrar campos del estado de run,
  escribir migraciones, o implementar el guardado con doble buffer y backups.
  Palabras clave: save, guardado, Dexie, IndexedDB, migración, versión, esquema,
  integridad, doble buffer, backup, permadeath.
---

# Migraciones e integridad de saves — Football RPG

En un roguelite con **permadeath**, un save corrupto es una run muerta injustamente. La persistencia (Dexie sobre IndexedDB) debe tener migraciones versionadas e integridad garantizada (constitución, Principios 2 y 8).

## Separación run vs partido

- **Estado de run** (persistente): franquicia, plantilla, química, temporada, progreso roguelite. Esto es lo que se guarda y migra.
- **Estado de partido** (efímero): mano, mazos barajados, reloj, momentum. NO se persiste como verdad; puede descartarse sin afectar la integridad de la run.

Regla: descartar el estado de partido nunca debe corromper el estado de run.

## Versionado del esquema

Cada save lleva una `schemaVersion` explícita. Dexie versiona por `.version(n).stores(...).upgrade(...)`. Nunca cambies la forma de los datos sin subir la versión y escribir la migración.

```ts
// apps/game/src/db.ts
import Dexie from "dexie";

export const db = new Dexie("football-rpg");

db.version(1).stores({ runs: "id, updatedAt", backups: "id, createdAt" });

db.version(2)
  .stores({ runs: "id, updatedAt", backups: "id, createdAt" })
  .upgrade(async (tx) => {
    await tx.table("runs").toCollection().modify((run) => {
      // migración idempotente v1 → v2
      run.chemistry ??= {};
      run.schemaVersion = 2;
    });
  });
```

Principios de migración:
- **Idempotente:** correr la migración dos veces no rompe nada.
- **Hacia adelante:** cada versión sabe migrar desde la anterior; encadenadas cubren saltos.
- **Con validación Zod al leer:** todo save cargado (o importado) se valida contra el esquema de su versión antes de usarse. Si no valida, se rechaza y se ofrece el backup.

## Guardado con doble buffer

Una escritura interrumpida no puede dejar ilegible el save vigente. Escribe en un buffer alterno y confirma solo al terminar:

```
slotActivo = A
guardar():
  escribir estado en slot B (el inactivo)
  fsync/commit de la transacción
  marcar B como activo (operación atómica: un solo campo "activeSlot")
  A queda como el backup inmediato
```

Si el proceso muere a mitad, el `activeSlot` sigue apuntando al último save íntegro. Nunca sobrescribas el slot activo en el sitio.

## Rotación de backups

- Antes de una operación destructiva (fin de temporada, draft, relegación/permadeath), snapshot del estado de run a la tabla `backups`.
- Mantén los últimos K backups (p. ej. 5) con rotación FIFO.
- Un backup es un save completo y validable, no un diff.

## Export / import

- **Export:** serializa el estado de run + `schemaVersion` a JSON. Es la copia de seguridad del usuario.
- **Import:** valida con Zod, migra si `schemaVersion` es anterior, y solo entonces lo carga. Rechaza lo que no valide con un mensaje claro; no cargues algo dudoso "a medias".

## Checklist al cambiar el esquema de un save

- [ ] Subí `schemaVersion` y añadí `db.version(n).upgrade(...)`.
- [ ] La migración es idempotente y cubre el salto desde la versión anterior.
- [ ] Actualicé el esquema Zod y valido al leer/importar.
- [ ] Probé: cargar un save de la versión anterior migra correctamente.
- [ ] Probé: una escritura interrumpida (simulada) deja el save vigente legible.
- [ ] El export de la versión nueva se puede reimportar.

## Qué NO hacer

- No cambies la forma de los datos sin subir versión y escribir migración.
- No sobrescribas el slot activo directamente (usa doble buffer).
- No cargues un save/import sin validarlo con Zod.
- No mezcles estado de partido efímero dentro del save de run persistente.
- No borres el último backup bueno antes de confirmar que el nuevo save es íntegro.