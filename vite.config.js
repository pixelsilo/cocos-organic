import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  build: {
    lib: { entry: 'src/main.js', name: 'CocosOrganic', formats: ['iife'], fileName: () => 'site.js' },
    outDir: 'dist',
    emptyOutDir: true,
    minify: mode !== 'development',
    sourcemap: mode === 'development',
  },
  preview: { cors: true },
}));
