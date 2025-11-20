# Landing Page Builder - Testing Guide

This guide explains how to test the complete landing page builder flow from the dashboard to the generated Astro project.

## Prerequisites

1. Ensure all dependencies are installed:
   ```bash
   bun install
   ```

2. Build the CLI package:
   ```bash
   cd packages/cli
   bun run build
   cd ../..
   ```

3. Build the server package:
   ```bash
   cd apps/server
   bun run build
   cd ../..
   ```

## Step 1: Start the Server

The server hosts the block registry API that the CLI uses to fetch blocks.

```bash
cd apps/server
bun run src/index.ts
```

The server should start on port 9876. Verify the registry endpoints are working:

```bash
# Test block list endpoint
curl http://localhost:9876/api/registry/blocks

# Test specific block endpoint
curl http://localhost:9876/api/registry/blocks/hero-parallax
```

## Step 2: Start the Dashboard (Optional)

If you want to test the full UI flow:

```bash
cd apps/dashboard
bun run dev
```

Navigate to the LP Builder page and:
1. Select and arrange blocks
2. Click the "Export" button
3. Copy the generated CLI command

## Step 3: Test CLI Locally

### Option A: Direct Node Execution

```bash
cd packages/cli
node dist/src/index.js create --blocks=hero-parallax,features-one,footer-one
```

### Option B: Using npm link

```bash
cd packages/cli
npm link
cd ../../
contentagen-create create --blocks=hero-parallax,features-one,footer-one
```

### Option C: Using npx (after publishing)

```bash
npx @contentagen/create --blocks=hero-parallax,features-one,footer-one
```

## Step 4: Verify Generated Project

After the CLI completes, you should have a new directory with:

1. Check project structure:
   ```bash
   cd my-landing-page
   ls -la
   ```

   Expected files:
   - `package.json`
   - `astro.config.mjs`
   - `tsconfig.json`
   - `src/` directory with components, layouts, pages, lib, and styles

2. Check installed blocks:
   ```bash
   ls src/components/blocks/
   ```

   Should contain your selected blocks (e.g., `hero-parallax.tsx`, `features-one.tsx`, `footer-one.tsx`)

3. Check shadcn components:
   ```bash
   ls src/components/ui/
   ```

   Should contain required components (e.g., `button.tsx`, `card.tsx`, `table.tsx`)

4. Check main page:
   ```bash
   cat src/pages/index.astro
   ```

   Should import and render your blocks in order

## Step 5: Install Dependencies and Run

```bash
npm install
```

Wait for dependencies to install, then start the dev server:

```bash
npm run dev
```

The Astro dev server should start (usually on port 4321). Open your browser to view the landing page.

## Step 6: Verify the Landing Page

Open the page in your browser and verify:

1. All selected blocks are rendered
2. Blocks appear in the correct order
3. Styling is applied correctly (Tailwind CSS)
4. Interactive elements work (buttons, etc.)
5. No console errors

## Testing Different Block Combinations

Test various combinations to ensure robustness:

### Minimal Setup
```bash
contentagen-create create --blocks=hero-section-1,footer-one
```

### Full Setup
```bash
contentagen-create create --blocks=hero-parallax,hero-section-1,features-one,pricing-table,footer-one
```

### Single Block
```bash
contentagen-create create --blocks=hero-parallax
```

## Common Issues and Solutions

### Issue: "Block not found" error

**Solution**: Verify the server is running and block IDs are correct. Check available blocks:
```bash
curl http://localhost:9876/api/registry/blocks
```

### Issue: Import errors in generated project

**Solution**: Check that import paths in blocks are correctly transformed. Review `packages/cli/src/utils/registry.ts` transformation logic.

### Issue: Styling not applied

**Solution**: 
- Verify `globals.css` is imported in `index.astro`
- Check Tailwind CSS configuration
- Ensure `@astrojs/tailwind` integration is properly set up

### Issue: React components not rendering

**Solution**:
- Verify `@astrojs/react` integration is installed
- Check that components use `client:load` directive in Astro
- Ensure React dependencies are in `package.json`

### Issue: Server registry path errors

**Solution**: The server looks for blocks at `packages/ui/src/blocks/`. Ensure:
- Server is run from the correct directory
- Path in `apps/server/src/integrations/registry-utils.ts` is correct
- Block files exist in the UI package

## Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Registry API endpoints return valid data
- [ ] Dashboard loads and displays block browser
- [ ] Export dialog shows correct CLI command
- [ ] CLI creates project directory
- [ ] All selected blocks are installed
- [ ] Required shadcn components are installed
- [ ] `package.json` has all necessary dependencies
- [ ] `index.astro` imports blocks correctly
- [ ] `npm install` completes successfully
- [ ] `npm run dev` starts dev server
- [ ] Landing page renders all blocks
- [ ] No console errors in browser
- [ ] Styling is applied correctly
- [ ] Interactive elements work

## Automated Testing (Future)

Consider adding:
1. Unit tests for CLI utilities
2. Integration tests for registry API
3. E2E tests with Playwright/Cypress
4. Snapshot tests for generated code

## Performance Testing

1. Test with maximum number of blocks
2. Measure CLI execution time
3. Verify generated bundle size
4. Check Astro build performance

## Next Steps

After successful testing:
1. Update version numbers
2. Prepare for npm publish (if making public)
3. Add CI/CD workflows
4. Create user documentation
5. Add example landing pages

