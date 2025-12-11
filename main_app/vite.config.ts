import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

const isServerBuild = process.env.npm_lifecycle_event === 'build:server'

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  build: isServerBuild
    ? {
        ssr: true,
        outDir: 'dist/server',
        rollupOptions: {
          input: './src/server/server.ts',
          output: {
            entryFileNames: '[name].js',
          },
        },
        copyPublicDir: false,
      }
    : {
        outDir: 'dist/client',
        emptyOutDir: true,
      },
})
