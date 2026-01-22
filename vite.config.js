import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

// ----------------------------------------------------------------------

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const manifestPlugin = () => {
    return {
      name: 'generate-manifest',
      configureServer(server) {
        server.middlewares.use('/manifest.json', (req, res, next) => {
          const manifest = {
            name: env.VITE_APP_NAME,
            short_name: env.VITE_APP_SHORT_NAME,
            description: env.VITE_APP_DESCRIPTION,
            icons: [
              {
                src: '/favicon/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/favicon/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ],
            theme_color: env.VITE_PWA_THEME_COLOR,
            background_color: env.VITE_PWA_BACKGROUND_COLOR,
            display: env.VITE_PWA_DISPLAY
          };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(manifest, null, 2));
        });
      },
      generateBundle() {
        const manifest = {
          name: env.VITE_APP_NAME,
          short_name: env.VITE_APP_SHORT_NAME,
          description: env.VITE_APP_DESCRIPTION,
          icons: [
            {
              src: '/favicon/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/favicon/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          theme_color: env.VITE_PWA_THEME_COLOR,
          background_color: env.VITE_PWA_BACKGROUND_COLOR,
          display: env.VITE_PWA_DISPLAY
        };
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(manifest, null, 2)
        });
      }
    };
  };

  return {
    plugins: [
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
