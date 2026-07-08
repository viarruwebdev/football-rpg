# CLAUDE.md

@AGENTS.md

> Todo el contexto del proyecto (arquitectura, reglas de oro, comandos, metodología) vive en `AGENTS.md`.
> La línea `@AGENTS.md` de arriba lo importa completo al arrancar la sesión. La primera vez, Claude Code pedirá
> aprobar el import externo una sola vez: acéptalo. No dupliques aquí lo que ya está en `AGENTS.md`.
>
> Este archivo contiene **solo** lo específico de Claude Code. Otros agentes (OpenCode, Antigravity, Codex…)
> leen `AGENTS.md` directamente y no ven este archivo.

## Específico de Claude Code

- **Compactación:** al compactar la conversación, preserva íntegras (a) las cuatro reglas de oro de `AGENTS.md §2`
  y (b) la lista completa de archivos modificados en la sesión.
- **Subagentes:** para investigar (leer docs de una librería, explorar el catálogo de cartas, rastrear un bug),
  usa un subagente en vez de llenar el contexto principal. Deja la implementación en el hilo principal.
- **Context7:** cuando necesites la API real de una librería, añade `use context7` en tu propio razonamiento
  antes de escribir el código. No asumas firmas de memoria.
- **Spec Kit:** los comandos aparecen como `/speckit.*`. Empieza cada feature por `/speckit.specify`, nunca por el código.
- **Determinismo:** antes de cerrar cualquier tarea que toque `packages/core`, verifica que no has introducido
  `Math.random`, `Date.now`, `fetch` ni acceso al DOM. Es el error más fácil de colar y el más caro.
- **Cierre de tarea:** deja en verde `pnpm type`, `pnpm check` y `pnpm test` antes de considerar algo terminado.

## Overrides personales (opcional)

Para preferencias tuyas que no quieres versionar (atajos, tono, notas locales), usa `CLAUDE.local.md`
(añádelo a `.gitignore`). No lo leerán los demás agentes.