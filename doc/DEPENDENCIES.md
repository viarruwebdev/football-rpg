# DEPENDENCIAS — Football RPG

Lista de librerías, para qué sirve cada una y cómo instalarlas. Toolchain de calidad: **Biome** (un binario para lint + formato + orden de imports; reemplaza a ESLint y Prettier). No añadir ESLint ni Prettier al proyecto.

> Gestor de paquetes recomendado: **pnpm** (rápido y eficiente en disco). Todos los comandos funcionan igual con `npm` cambiando `pnpm add` por `npm install`.

---

## 1. Runtime (dependencias de producción)

```bash
pnpm add react react-dom zustand dexie zod
```

| Librería | Rol | Por qué |
|---|---|---|
| `react`, `react-dom` | UI | Ecosistema maduro; excelente asistencia de IA. |
| `zustand` | Estado de la app | Store mínimo, sin boilerplate, fácil de mantener separado del motor puro. |
| `dexie` | Persistencia (IndexedDB) | Capa cómoda sobre IndexedDB con migraciones versionadas para los saves. |
| `zod` | Validación | Valida el catálogo de contenido y los saves importados; genera tipos. |

**Animación** (los duelos necesitan drama):

```bash
pnpm add framer-motion
```

## 2. Desarrollo (build, tipos, tests, calidad)

```bash
pnpm add -D vite @vitejs/plugin-react typescript \
  vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  fast-check \
  @biomejs/biome
```

| Librería | Rol |
|---|---|
| `vite`, `@vitejs/plugin-react` | Dev server y build. |
| `typescript` | Tipos (modo estricto). `tsc --noEmit` es la fuente de verdad. |
| `vitest`, `@vitest/coverage-v8`, `jsdom` | Test runner + cobertura + DOM simulado. |
| `@testing-library/*` | Tests de componentes centrados en comportamiento. |
| `fast-check` | **Property-based testing** — clave para el motor determinista (invariantes de la tabla de resolución, PRNG, barajado). |
| `@biomejs/biome` | Lint + formato + orden de imports en un solo binario. |

## 3. BDD (Gherkin) — elige uno

Los escenarios de duelo/partido se escriben como `.feature` (Dado/Cuando/Entonces con semilla fija) y sirven de criterios de aceptación de las specs.

- **Opción A — un solo runner (recomendada):** adaptador Gherkin para Vitest, para no montar un segundo runner.
  ```bash
  pnpm add -D @amiceli/vitest-cucumber   # o: quickpickle
  ```
- **Opción B — estándar clásico:** Cucumber.js, independiente y muy probado.
  ```bash
  pnpm add -D @cucumber/cucumber
  ```

> Verifica la versión y el estado actuales del adaptador de Vitest con Context7 o `npm view` antes de fijarlo; el mundo Gherkin+Vitest se mueve. Cucumber.js es la apuesta segura si prefieres estabilidad sobre integración.

## 4. Biome — instalación y configuración

Inicializa (genera `biome.json` con el `$schema` de **tu** versión instalada):

```bash
pnpm exec biome init
```

`biome.json` de partida (ajusta a gusto; `biome init` fija el `$schema` correcto de tu versión 2.x):

```json
{
	"$schema": "https://biomejs.dev/schemas/2.5.2/schema.json",
	"vcs": {
		"enabled": true,
		"clientKind": "git",
		"useIgnoreFile": true
	},
	"files": {
		"includes": ["**", "!dist/", "!node_modules/", "!coverage/", "!.specify/"]
	},
	"linter": {
		"enabled": true,
		"rules": {
			"correctness": {
				"noUnusedVariables": "error",
				"useExhaustiveDependencies": "error"
			},
			"suspicious": {
				"noExplicitAny": "warn"
			}
		}
	},
	"formatter": {
		"enabled": true,
		"indentStyle": "tab",
		"indentWidth": 4,
		"lineWidth": 100
	},
	"javascript": {
		"formatter": { "quoteStyle": "single", "semicolons": "always" }
	},
	"assist": {
		"enabled": true,
		"actions": {
			"source": {
				"organizeImports": "on"
			}
		}
	}
}
```

> Si migras desde una config vieja o desde ESLint/Prettier, Biome trae asistentes: `biome migrate` y `biome migrate eslint --write` / `biome migrate prettier --write`. En Biome 2, el flag de aplicar cambios es `--write` (antes `--apply`).

## 5. Scripts de `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "type": "tsc --noEmit",
    "check": "biome check --write .",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "ci": "biome ci .",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "sim": "vite-node tools/sim/index.ts"
  }
}
```

## 6. Puerta de calidad (pre-commit, opcional pero recomendado)

Para que nada entre sin pasar por Biome + tests, un hook ligero. Con **lefthook**:

```bash
pnpm add -D lefthook && pnpm exec lefthook install
```

`lefthook.yml`:

```yaml
pre-commit:
  parallel: true
  commands:
    check: { run: pnpm check }
    types: { run: pnpm type }
    test:  { run: pnpm test }
```

## 7. Notas

- **No** añadir: ESLint, Prettier, Next.js, ningún cliente HTTP/servidor, ni SDK de LLM. La IA rival es heurística local (ver `AGENTS.md §2`).
- El motor (`packages/core`) no debería necesitar dependencias de runtime más allá de utilidades puras. Mantenlo así.
- Cualquier dependencia nueva se anota aquí con una línea de justificación.