import { vitePlugin as remix } from '@remix-run/dev'
import { vercelPreset } from '@vercel/remix/vite'
import { remixDevTools } from 'remix-development-tools'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    sourcemap: true,
    target: 'esnext',
  },
  server: {
    port: 3000,
  },
  plugins: [
    remixDevTools(),
    remix({ presets: [vercelPreset()] }),
    tsconfigPaths(),
  ],
})
