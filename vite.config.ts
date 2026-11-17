import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR & WebSocket server disabled inside AI Studio container to prevent port 24678 collisions.
      hmr: process.env.DISABLE_HMR === 'true' || Boolean(process.env.APPLET_ID) ? false : undefined,
      ws: process.env.DISABLE_HMR === 'true' || Boolean(process.env.APPLET_ID) ? (false as const) : undefined,
      // Disable file watching to save CPU/RAM and prevent flickering during agent edits.
      watch: process.env.DISABLE_HMR === 'true' || Boolean(process.env.APPLET_ID) ? null : {},
    },
  };
});
