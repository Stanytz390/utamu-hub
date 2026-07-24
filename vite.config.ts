import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackStartPlugin } from '@tanstack/start-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite'; // Optional – if you use Tailwind CSS v4

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Start handles SSR and server functions
    TanStackStartPlugin(),
    // React support
    react(),
    // Resolve tsconfig paths (e.g., @/ → ./src)
    tsconfigPaths(),
    // Tailwind CSS (if you use it; remove if not)
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // Output directory (Vercel expects .vercel/output)
    outDir: '.vercel/output',
    sourcemap: true,
  },
  // Environment variables – Vite injects VITE_* into import.meta.env
  envPrefix: 'VITE_',
  // Resolve aliases (optional – tsconfigPaths already does this)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});