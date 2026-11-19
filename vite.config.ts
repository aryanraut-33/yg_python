import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const pyodideVersion: string = JSON.parse(
  readFileSync(new URL('./node_modules/pyodide/package.json', import.meta.url), 'utf8'),
).version;

// Cross-origin isolation lets the Python worker use SharedArrayBuffer,
// which powers the Stop button (interrupts) and input().
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// Mirror public/_headers locally so `npm run preview` caches Python like Cloudflare does.
const previewCaching: Plugin = {
  name: 'yg-preview-caching',
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/pyodide/') || req.url?.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), previewCaching],
  define: { __PYODIDE_VERSION__: JSON.stringify(pyodideVersion) },
  server: { headers: isolation },
  preview: { headers: isolation },
  worker: { format: 'es' },
});
