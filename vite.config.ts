/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

const ext = {
  cjs: 'cjs',
  es: 'js',
} as const

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

const IN_LADLE = process.env['LADLE']
const BUILD_APP = process.env['BUILD_APP']

const externalPackages = [
  ...Object.keys(packageJson.dependencies),
  ...Object.keys(packageJson.peerDependencies),
  /@lexical\/react\/.*/,
  'react/jsx-runtime', 
  'react/jsx-dev-runtime'
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(IN_LADLE ? {} : { jsxRuntime: 'classic' } as const),
    !BUILD_APP && dts({
      rollupTypes: true,
      staticImport: true,
      compilerOptions: {
        skipLibCheck: true,
      },
    }),
    svgr({
      svgrOptions: {
        svgo: true,
        replaceAttrValues: { 'black': 'currentColor' }
      }
    }),
    tsconfigPaths()
  ].filter(Boolean),
  root: BUILD_APP ? 'app' : '.',
  server: {
    proxy: {
      '/uploads': 'http://localhost:65432'
    },
  },
  build: BUILD_APP ? {
    outDir: '../dist-app',
    rollupOptions: {
      input: 'app/index.html'
    }
  } : {
    minify: 'terser',
    cssMinify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: (format, entryName) => {
        return `${entryName}.${ext[format as 'cjs' | 'es']}` 
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src'
      },
      external: externalPackages,
    },
  },
  test: {
    include: ['src/test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
  css: {
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly'
    }
  }
})
