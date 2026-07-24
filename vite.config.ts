import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Start plugin - lazima iwe kwanza
    tanstackStart({
      server: {
        entry: "src/server.ts", // Path ya server entry file yako
      },
    }),
    react(),
    tsConfigPaths(), // Inasaidia path alias kama @/integrations/...
    tailwindcss(),   // Tailwind CSS v4
  ],

  // Mipangilio ya SSR
  ssr: {
    noExternal: [
      "@tanstack/react-start",
      "@tanstack/react-router",
      "@tanstack/react-query",
    ],
  },

  // Mipangilio ya ujenzi
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Gawanya bundles kubwa katika chunks ndogo
          vendor: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
    sourcemap: true, // Kwa ajili ya debugging
  },

  // Mipangilio ya development server
  server: {
    port: 3000,
    strictPort: false,
    host: true, // Inaruhusu kufikiwa kutoka network nyingine
  },

  // Mipangilio ya preview server
  preview: {
    port: 3000,
  },

  // Path aliases
  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // Inject environment variables (kwa client-side)
  define: {
    "process.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
    "process.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  },

  // Mipangilio ya Nitro (kwa ajili ya Vercel deployment)
  nitro: {
    preset: "vercel",
    server: {
      entry: "src/server.ts",
    },
    output: {
      dir: ".output",
    },
    externals: {
      // Usiweke @tanstack/react-start kama external - lazima iwe bundled
      inline: ["@tanstack/react-start"],
    },
    compressPublicAssets: true,
  },

  // Mipangilio ya optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
  },
});