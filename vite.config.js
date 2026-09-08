import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    minify: true, // FIXED: minify was false, preventing production builds from being optimized — use Vite's default minification
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: true, // FIXED: sourcemap was inside lib object where Vite ignores it — moved to build level so source maps are generated
    lib: {
      entry: './src/js/index.js',
      name: 'Urso',
      fileName: 'js/index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['pixi.js', 'gsap', 'howler', '@esotericsoftware/spine-pixi-v8'], // FIXED: was empty array causing all dependencies to be bundled — now externalized so consuming apps don't get duplicate copies
      output: {
        inlineDynamicImports: true
      }
    },
  }
});