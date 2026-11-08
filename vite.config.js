import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

// ----------------------------------------------------------------------

export default defineConfig(({ mode }) => {
  // Load env from .env (defaults) and .env.local (local overrides) only
  const env = loadEnv(mode, process.cwd(), '');

  /**
   * Bump when a logo is replaced in place on storage. The URL stays the same and storage
   * sends no Cache-Control, so without a new ?v= browsers can keep showing the old image.
   */
  const LOGO_VERSION = '20261102';
  ['VITE_APP_LOGO_PATH', 'VITE_FAVICON_PATH', 'VITE_PWA_ICON_192_PATH', 'VITE_PWA_ICON_512_PATH'].forEach((key) => {
    const url = env[key];
    if (url && /^https?:\/\//.test(url)) {
      env[key] = `${url}${url.includes('?') ? '&' : '?'}v=${LOGO_VERSION}`;
    }
  });

  /** Replaces %VITE_*% placeholders in index.html so build never sees invalid URIs (e.g. in href) */
  const htmlEnvPlugin = () => ({
    name: 'html-env',
    transformIndexHtml(html) {
      return html.replace(/%VITE_([A-Z_]+)%/g, (_, key) => env[`VITE_${key}`] ?? '');
    }
  });

  /**
   * Install / home-screen icons. The bundled /favicon/* files are the default school's
   * crest, so other schools point these at their own icons via VITE_PWA_ICON_*_PATH.
   */
  const buildManifest = () => ({
    name: env.VITE_APP_NAME,
    short_name: env.VITE_APP_SHORT_NAME,
    description: env.VITE_APP_DESCRIPTION,
    icons: [
      {
        src: env.VITE_PWA_ICON_192_PATH || '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: env.VITE_PWA_ICON_512_PATH || '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: env.VITE_PWA_THEME_COLOR,
    background_color: env.VITE_PWA_BACKGROUND_COLOR,
    display: env.VITE_PWA_DISPLAY
  });

  const manifestPlugin = () => {
    return {
      name: 'generate-manifest',
      configureServer(server) {
        server.middlewares.use('/manifest.json', (req, res, next) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(buildManifest(), null, 2));
        });
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(buildManifest(), null, 2)
        });
      }
    };
  };

  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      'import.meta.env.VITE_APP_LOGO_PATH': JSON.stringify(env.VITE_APP_LOGO_PATH ?? ''),
      'import.meta.env.VITE_FAVICON_PATH': JSON.stringify(env.VITE_FAVICON_PATH ?? ''),
    },
    plugins: [
      htmlEnvPlugin(),
      react(),
      checker({
        eslint: {
          lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        },
      }),
      manifestPlugin(),
    ],
    resolve: {
      alias: [
        {
          find: /^~(.+)/,
          replacement: path.join(process.cwd(), 'node_modules/$1'),
        },
        {
          find: /^src(.+)/,
          replacement: path.join(process.cwd(), 'src/$1'),
        },
      ],
    },
    server: {
      port: Number(env.VITE_DEV_PORT),
      host: env.VITE_HOST === 'true' ? true : env.VITE_HOST,
    },
    preview: {
      port: Number(env.VITE_PREVIEW_PORT),
    },
  };
});
