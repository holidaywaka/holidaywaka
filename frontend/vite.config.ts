import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline', // Automatically registers the service worker via an inline script
      includeAssets: ['favicon.ico', 'images/icon.png'],
      workbox: {
        // This ensures all built assets from React Router are cached for offline access
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        cleanupOutdatedCaches: true, // Automatically deletes old cached bundle versions
        skipWaiting: true,           // Forces the new service worker to activate immediately
        clientsClaim: true,          // Makes the activated service worker take control of all active clients/tabs immediately
      },
      manifest: {
        name: 'Holiday Waka Application',
        short_name: 'HolidayWaka',
        description: 'Travel and booking application',
        theme_color: '#228be6', // Match your Mantine/Brand primary theme color
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/images/icon.png', // Ensure these match paths in your public/ directory
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/images/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
});