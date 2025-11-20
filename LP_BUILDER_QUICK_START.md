# Landing Page Builder - Quick Start Guide

## What Was Built

A complete landing page builder system where users:
1. Select blocks in the dashboard
2. Get a CLI command
3. Run it to generate an Astro landing page project

## Quick Test

### 1. Start the Server

The server hosts the block registry API:

```bash
cd apps/server
bun run src/index.ts
```

Server will start on port 9876.

### 2. Build the CLI

```bash
cd packages/cli
bun run build
cd ../..
```

### 3. Test the CLI

Run the automated test:

```bash
bun run test:lp-cli
```

Or manually create a project:

```bash
node packages/cli/dist/src/index.js create --blocks=hero-parallax,features-one,footer-one
```

### 4. Use the Generated Project

```bash
cd my-landing-page  # or test-landing-page if using test script
npm install
npm run dev
```

Your landing page should be running at http://localhost:4321

## Using the Dashboard

### 1. Start the Dashboard (Optional)

```bash
cd apps/dashboard
bun run dev
```

### 2. Navigate to LP Builder

Go to `/lp-builder` route in the dashboard.

### 3. Export Your Design

1. The page already has some default blocks loaded
2. Add/remove/reorder blocks as desired
3. Click the "Export" button in the top-right corner
4. Copy the generated CLI command
5. Run it in your terminal

## Available Blocks

- `hero-parallax` - Parallax scrolling hero with product cards
- `hero-section-1` - Modern hero section with image and CTAs
- `features-one` - Features section with table and testimonials
- `footer-one` - Simple footer with links and social icons
- `pricing-table` - Interactive pricing table with plan comparison

## Project Structure

The CLI generates:

```
my-landing-page/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn components (button, card, table)
│   │   └── blocks/      # your selected blocks
│   ├── layouts/
│   │   └── Layout.astro # base layout
│   ├── lib/
│   │   └── utils.ts     # utility functions
│   ├── pages/
│   │   └── index.astro  # landing page with blocks
│   └── styles/
│       └── globals.css  # tailwind + theme
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Customization

After generation, you can:

1. Edit block content in `src/components/blocks/*.tsx`
2. Modify styles in `src/styles/globals.css`
3. Change layout in `src/layouts/Layout.astro`
4. Add more pages in `src/pages/`
5. Install additional components

## Troubleshooting

### "Block not found" error

Make sure the server is running on port 9876:

```bash
curl http://localhost:9876/api/registry/blocks
```

### Import errors in generated project

The CLI automatically transforms import paths. If you see errors, check:
- All blocks were downloaded
- shadcn components are in `src/components/ui/`
- `utils.ts` is in `src/lib/`

### Styling not working

Ensure:
- `globals.css` is imported in `index.astro`
- Tailwind CSS is configured in `astro.config.mjs`
- All dependencies are installed

## Next Steps

1. Customize your landing page content
2. Add your own images and copy
3. Deploy to Vercel, Netlify, or Cloudflare Pages
4. Set up custom domain

## Need Help?

- See `TESTING_LP_BUILDER.md` for detailed testing guide
- See `LP_BUILDER_IMPLEMENTATION.md` for technical details
- See `packages/cli/README.md` for CLI documentation

## Example Commands

```bash
# Minimal setup
npx @contentagen/create --blocks=hero-section-1,footer-one

# Full setup
npx @contentagen/create --blocks=hero-parallax,features-one,pricing-table,footer-one

# Custom output directory
npx @contentagen/create --blocks=hero-parallax,footer-one --output=my-awesome-site
```

## Development Commands

```bash
# Build CLI
cd packages/cli && bun run build

# Test CLI
bun run test:lp-cli

# Start server
cd apps/server && bun run src/index.ts

# Start dashboard
cd apps/dashboard && bun run dev
```

## What's Next?

The foundation is complete! You can now:

1. Add more blocks to the registry
2. Implement block customization in the dashboard
3. Add preview functionality
4. Support more themes
5. Create a block marketplace

Enjoy building beautiful landing pages! 🚀

