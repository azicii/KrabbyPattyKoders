import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite';


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}


function iosDiagnostics(): Plugin {
    return {
        name: 'picability-ios-diagnostics',
        transformIndexHtml(html) {
            if (process.env.NODE_ENV !== 'production' ||
                process.env.VITE_IOS_DIAGNOSTICS !== 'true') {
                return html;
            }

            return html.replace(
                '<head>',
                '<head>\n<script src="./ios-diagnostics.js"></script>'
            );
        }
    };
}


export default defineConfig({
    base: './',
    plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
        // Tailwind is not being actively used – do not remove them
    iosDiagnostics(),
    react(),
    tailwindcss(),
    VitePWA({
        registerType: 'prompt',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        includeAssets: [
            'favicon.ico',
            'favicon-16x16.png',
            'favicon-32x32.png',
            'favicon-48x48.png',
            'apple-touch-icon-streaky-v2.png',
            'pwa-192x192-streaky-v2.png',
            'pwa-512x512-streaky-v2.png',
            'pwa-maskable-512x512-streaky-v2.png'
        ],
        manifest: {
            name: 'Picability',
            short_name: 'Picability',
            description: 'Stay accountable with friends through daily photo and habit streaks.',
            theme_color: '#111827',
            background_color: '#111827',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            icons: [
                {
                    src: '/pwa-192x192-streaky-v2.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any'
                },
                {
                    src: '/pwa-512x512-streaky-v2.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any'
                },
                {
                    src: '/pwa-maskable-512x512-streaky-v2.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable'
                }
            ]
        },
        workbox: {
            navigateFallback: '/index.html',
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
        }
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
