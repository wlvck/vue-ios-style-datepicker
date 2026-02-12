import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      dts({
        // Generate .d.ts files
        insertTypesEntry: true,
        // Bundle all declarations into single file
        rollupTypes: true,
        // Output directory for declarations
        outDir: 'dist',
        // Include source files
        include: ['src/**/*.ts', 'src/**/*.vue'],
        // Exclude test files
        exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'node_modules'],
        // Copy .d.ts files to output
        copyDtsFiles: true,
        // Static import for better tree-shaking
        staticImport: true,
        // Clear console output
        clearPureImport: true,
      }),
    ],

    build: {
      // Library mode configuration
      lib: {
        // Entry point
        entry: resolve(__dirname, 'src/index.ts'),
        // Global variable name for UMD/IIFE builds
        name: 'Vue3IosDatepicker',
        // Output formats: ES Module, CommonJS, UMD
        formats: ['es', 'cjs', 'umd'],
        // Output file naming
        fileName: (format) => {
          switch (format) {
            case 'es':
              return 'vue-ios-style-datepicker.mjs'
            case 'cjs':
              return 'vue-ios-style-datepicker.cjs'
            case 'umd':
              return 'vue-ios-style-datepicker.umd.js'
            default:
              return `vue-ios-style-datepicker.${format}.js`
          }
        },
      },

      // Rollup specific options
      rollupOptions: {
        // Externalize Vue - don't bundle it
        external: ['vue'],
        output: {
          // Use named exports
          exports: 'named',
          // Global variables for UMD build
          globals: {
            vue: 'Vue',
          },
          // Asset file naming (CSS)
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') {
              return 'vue-ios-style-datepicker.css'
            }
            return assetInfo.name || 'assets/[name]-[hash][extname]'
          },
          // Preserve modules for better tree-shaking in ES build
          // (commented out as it conflicts with rollupTypes in dts plugin)
          // preserveModules: true,
          // preserveModulesRoot: 'src',
        },
      },

      // CSS configuration
      cssCodeSplit: false, // Bundle all CSS into single file

      // Minification
      minify: isProduction ? 'esbuild' : false,

      // esbuild minification options
      ...(isProduction && {
        esbuild: {
          drop: ['console', 'debugger'], // Remove console/debugger in production
          legalComments: 'none', // Remove comments
        },
      }),

      // Source maps
      sourcemap: true,

      // Target browsers
      target: 'es2020',

      // Output directory
      outDir: 'dist',

      // Clear output directory before build
      emptyOutDir: true,

      // Report compressed size
      reportCompressedSize: true,

      // Chunk size warning limit (KB)
      chunkSizeWarningLimit: 500,
    },

    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    // Define global constants
    define: {
      __DEV__: !isProduction,
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  }
})
