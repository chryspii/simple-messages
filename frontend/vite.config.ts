import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // API → backend (Express on 3001)
      "/messages": {
        target: "http://localhost:3001",
        changeOrigin: true
      },

      // Health endpoints
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true
      },

      // WebSocket → backend WS server
      "/ws": {
        target: "ws://localhost:8080",
        ws: true
      }
    }
  }
});
