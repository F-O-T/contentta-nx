import path from 'node:path'
import tailwindcss from "@tailwindcss/vite";
import url from 'node:url'
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import type { BuildEnvironmentOptions } from 'vite'


const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// SSR configuration
const ssrBuildConfig: BuildEnvironmentOptions = {
  ssr: true,
  outDir: 'dist/server',
  ssrEmitAssets: true,
  copyPublicDir: false,
  emptyOutDir: true,
  rollupOptions: {
    input: path.resolve(__dirname, 'src/entry-server.tsx'),
    output: {
      entryFileNames: '[name].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash][extname]',
    },
  },
}

// Client-specific configuration
const clientBuildConfig: BuildEnvironmentOptions = {
  outDir: 'dist/client',
  emitAssets: true,
  copyPublicDir: true,
  emptyOutDir: true,
  rollupOptions: {
    input: path.resolve(__dirname, 'src/entry-client.tsx'),
    output: {
      entryFileNames: 'assets/[name].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash][extname]',
    },
  },
}

// https://vitejs.dev/config/
export default defineConfig((configEnv) => {
  return {
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),

      react(),
    ],
    build: configEnv.isSsrBuild ? ssrBuildConfig : clientBuildConfig,
  }
})
