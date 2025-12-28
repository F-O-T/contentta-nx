# AGENTS.md

## Build, Lint, and Test Commands
- **Install dependencies:** `bun install`
- **Build:** `bun run build`
- **Lint & Format:** `bun run check` (Biome: lints and formats)
- **Typecheck:** `bun run typecheck`
- **Run all tests:** `bun run test`
- **Run a single test:** `bun run test -- <test-file-or-pattern>` (uses Vitest, e.g. `bun run test -- __tests__/sdk.test.ts`)

## Code Style Guidelines
- **Imports:** Use organized imports; Biome auto-organizes (`organizeImports: "on"`).
- **Formatting:** 
  - Indent with tabs.
  - Use double quotes for strings.
  - Biome enforces formatting and recommended lint rules.
- **Types:** 
  - Use TypeScript strict mode (`strict: true` in tsconfig).
  - Prefer explicit types and interfaces.
- **Naming Conventions:** 
  - Use descriptive, camelCase for variables/functions.
  - Use PascalCase for types/classes.
- **Error Handling:** 
  - Use robust error handling (see SDK description).
  - Prefer throwing or returning errors with context.
- **General:** 
  - Keep code modular and readable.
  - Avoid unused variables and imports.
  - Use ES2022 features.
- **Test Files:** Place in `__tests__/`, use Vitest.

## Notes
- No Cursor or Copilot rules detected.
- Biome and TypeScript are the main style and type enforcers.
