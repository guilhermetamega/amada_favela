import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Em produção (Vercel + BrowserRouter), base relativa quebra rotas profundas
  // como /raffles/:slug e /validate-proof/:code, gerando 404 de assets e tela branca.
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
