# Contributing to Montte

## Quick Start

1. **Clone & install:** `git clone https://github.com/F-O-T/montte-nx.git && cd montte-nx && bun install`
2. **Set up env:** Run `bun run scripts/env-setup setup` to configure your environment files
3. **Database:** Run `bun run scripts/db-push push` to set up the database schema
4. **Start dev:** `bun run dev:all` (or `bun run dev:dashboard`, `bun run dev:blog`)

## How to Contribute

### 🐛 Testing & Bugs
- Test your changes thoroughly before submitting
- Report issues with steps to reproduce
- Test edge cases and performance

### 🌍 Translations
- Add languages in `packages/localization/src/locales/`
- Translate UI text, error messages, help docs

### ✨ Features & Docs
- Suggest finance tracking features and workflow improvements
- Improve documentation and examples

## Project Structure

Nx monorepo with:

**Apps:** `server/` (ElysiaJS + tRPC), `dashboard/` (React), `blog/` (Astro), `docs/`, `landing-page/`
**Packages:** `api/`, `authentication/`, `database/`, `ui/` (shadcn/ui), and more for localization, environment management

## Code Standards

**Formatting:** Use [Biome](https://biomejs.dev/) - 3 spaces, 80 chars, double quotes
**TypeScript:** Explicit types, camelCase variables, PascalCase components
**React/Astro:** Function components, TanStack Router, `.astro` for pages
**Commits:** Conventional format: `type(scope): description`

Run checks: `bun run format && bun run typecheck && bun run test`

## Workflow

1. **Branch:** `git checkout -b feature/name` or `fix/issue-description`
2. **Code:** Follow standards, write tests, update docs
3. **Check:** `bun run format && bun run typecheck`
4. **Commit:** `git commit -m "feat(scope): description"`
5. **Push & PR:** Create PR with descriptive title and changes

## Testing

- Run: `bun run test` (if available) or test manually
- Write tests for new features when appropriate
- Test happy path and error cases

## Issues

**Bugs:** Include description, steps to reproduce, expected/actual behavior, environment
**Features:** Include description, use case, implementation ideas
**Questions:** Check docs and existing issues first

---

Thanks for contributing! 🚀
