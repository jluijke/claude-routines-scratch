import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

/**
 * Build config for the double-click-and-play version.
 *
 * The output has to run from a file:// URL, where ES modules are blocked by
 * the browser's CORS rules. So this builds one classic-script IIFE bundle with
 * no code splitting, which tools/build-single-file.mjs then inlines into a
 * single HTML file.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'game.js',
        assetFileNames: 'game[extname]',
      },
    },
  },
})
