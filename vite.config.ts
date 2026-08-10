import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      // MapLibre owns its worker entry. Pre-bundling can leave a stale
      // maplibre-gl-worker.mjs reference after the local server restarts.
      exclude: ['maplibre-gl'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('maplibre-gl')) return 'maplibre';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('motion')) return 'motion';
          },
        },
      },
    },
  };
});
