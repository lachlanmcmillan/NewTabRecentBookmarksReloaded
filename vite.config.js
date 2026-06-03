import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync } from 'fs';

export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'src/newtab.html'),
        options: resolve(__dirname, 'src/options.html'),
        faviconcacher: resolve(__dirname, 'src/faviconcacher.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [
    {
      name: 'copy-extension-files',
      writeBundle() {
        cpSync(
          resolve(__dirname, 'src/icons'),
          resolve(__dirname, 'dist/icons'),
          { recursive: true },
        );
      },
    },
  ],
});
