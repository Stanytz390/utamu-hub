import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({ server: { entry: "src/server.ts" } }),
    react(),
    tsConfigPaths(),
    tailwindcss(),
  ],
  ssr: {
    noExternal: ["@tanstack/react-start", "@tanstack/react-router", "@tanstack/react-query"],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  server: { port: 3000, host: true },
  resolve: { alias: { "@": "/src" } },
  define: {
    "process.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
    "process.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY),
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  nitro: {
    preset: "vercel",
    server: { entry: "src/server.ts" },
    output: { dir: ".output" },
    externals: { inline: ["@tanstack/react-start"] },
    compressPublicAssets: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query", "@supabase/supabase-js"],
  },
});