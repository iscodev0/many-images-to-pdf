// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  // Configuración para manejo de rutas 404
  trailingSlash: "never",
  build: {
    format: "directory"
  }
});