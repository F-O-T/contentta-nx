# @contentagen/create

CLI tool to create Astro landing pages with ContentaGen blocks.

## Usage

### From the Dashboard

1. Go to the LP Builder in your dashboard
2. Select and arrange the blocks you want
3. Click the "Export" button
4. Copy the generated command
5. Run it in your terminal

Example command:

```bash
npx @contentagen/create --blocks=hero-parallax,features-one,footer-one
```

### Command Options

- `--blocks` (required): Comma-separated list of block IDs
- `--output` (optional): Output directory path (default: prompts for project name)
- `--theme` (optional): Theme name (default: "default")

## Development

### Building the CLI

```bash
cd packages/cli
bun install
bun run build
```

### Testing Locally

After building, you can test the CLI locally by running:

```bash
node dist/src/index.js create --blocks=hero-parallax,features-one
```

Or link it globally:

```bash
npm link
contentagen-create create --blocks=hero-parallax,features-one
```

### Environment Variables

- `CONTENTAGEN_REGISTRY_URL`: Registry API URL (default: http://localhost:9876)

## What It Does

The CLI will:

1. Initialize a new Astro project with React integration
2. Set up Tailwind CSS with shadcn-compatible configuration
3. Install required shadcn components (button, card, table, etc.)
4. Fetch and install selected blocks from the registry
5. Generate a landing page with blocks in the specified order
6. Set up utilities, styles, and layouts

## Generated Project Structure

```
my-landing-page/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn components
│   │   └── blocks/      # contentagen blocks
│   ├── lib/
│   │   └── utils.ts     # utility functions
│   ├── layouts/
│   │   └── Layout.astro # base layout
│   ├── pages/
│   │   └── index.astro  # main landing page
│   └── styles/
│       └── globals.css  # global styles
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## After Project Creation

1. Install dependencies:

   ```bash
   cd my-landing-page
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Troubleshooting

### Registry Connection Issues

If the CLI cannot connect to the registry, make sure:

- The ContentaGen server is running (default port 9876)
- Set `CONTENTAGEN_REGISTRY_URL` environment variable if using a custom URL

### Missing Blocks

If a block is not found:

- Verify the block ID is correct
- Check that the block exists in the registry
- Ensure the server's blocks directory is accessible
