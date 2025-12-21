import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración compatible con Replit
export default defineConfig({
  plugins: [react()],

  server: {
    host: true,          // 🔴 OBLIGATORIO para Replit
    port: 5173,          // Puerto estándar de Vite
    strictPort: true,    // No cambiar de puerto
    cors: true,
  },

  preview: {
    host: true,
    port: 5173,
  },

  resolve: {
    alias: {
      "@": "/src",
    },
  },
});