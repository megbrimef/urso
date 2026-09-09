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
      },
      // FIXED: suppress IMPORT_IS_UNDEFINED warning from @urso/revolt-fx (which deliberately tests for PIXI.BLEND_MODES undefined to detect v8) while passing through all other warnings
      onwarn(warning, warn) {
        if (warning.code === 'IMPORT_IS_UNDEFINED' && warning.id && warning.id.includes('@urso/revolt-fx')) {
          // Suppress: @urso/revolt-fx uses a v8 feature detection pattern that deliberately imports an undefined symbol;
          // the absence of BLEND_MODES is how it detects v8. This is not a bug in the dependency.
          return;
        }
        warn(warning);
      }
    },
  }
});