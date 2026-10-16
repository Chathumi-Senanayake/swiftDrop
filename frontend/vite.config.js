import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the React app runs on :5173 and forwards API calls and images to the Express server on :3000.
export default defineConfig({
  plugins: [react()],
  css: { postcss: {} }, // don't pick up PostCSS/Tailwind configs from folders above the project
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
