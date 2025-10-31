# Contributing to ContentaGen

## Quick Start

1. **Clone & install:** `git clone <repo> && cd contentagen && bun install`
2. **Set up env:** Copy `.env.example` to `.env` and configure
3. **Start dev:** `bun run dev:all` (or `bun run dev:dashboard`, `bun run dev:blog`)
4. **Database:** `bun run db:push:local && bun run db:studio:local`

## How to Contribute

### 🐛 Testing & Bugs
- Test at [app.contentagen.com](https://app.contentagen.com)
- Report issues with steps to reproduce
- Test edge cases and performance

### 🌍 Translations
- Add languages in `packages/localization/src/locales/`
- Translate UI text, error messages, help docs

### ✨ Features & Docs
- Suggest SEO features and workflow improvements
- Improve documentation and examples

## Project Structure

Nx monorepo with:

**Apps:** `server/` (ElysiaJS + tRPC), `dashboard/` (React), `blog/` (Astro), `docs/`, `landing-page/`
**Packages:** `api/`, `authentication/`, `database/`, `workers/`, `ui/` (shadcn/ui)

## Code Standards

**Formatting:** Use [Biome](https://biomejs.dev/) - 3 spaces, 80 chars, double quotes
**TypeScript:** Explicit types, camelCase variables, PascalCase components
**React/Astro:** Function components, TanStack Router, `.astro` for pages
**Commits:** Conventional format: `type(scope): description`

Run checks: `bun run format && bun run typecheck && bun run test`

## Workflow

1. **Branch:** `git checkout -b feature/name` or `fix/issue-description`
2. **Code:** Follow standards, write tests, update docs
3. **Check:** `bun run check && bun run typecheck && bun run test`
4. **Commit:** `git commit -m "feat(scope): description"`
5. **Push & PR:** Create PR with descriptive title and changes

## Testing

- Run: `bun run test` (all) or `npx nx test project-name` (specific)
- Write tests for new features
- Test happy path and error cases

## Issues

**Bugs:** Include description, steps to reproduce, expected/actual behavior, environment
**Features:** Include description, use case, implementation ideas
**Questions:** Check docs and existing issues first

---

Thanks for contributing! 🚀
