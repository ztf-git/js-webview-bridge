import { defineConfig } from 'vite'
import path from 'path'
import dts from 'vite-plugin-dts'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      insertTypesEntry: true,
      rollupTypes: true
    })
  ],
  build: {
    outDir: 'dist',
    lib: {
      name: 'web-js-bridge ',
      entry: {
        core: path.resolve(__dirname, 'src/core/js-bridge.ts'),
        rx: path.resolve(__dirname, 'src/rx-js-bridge.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      // https://rollupjs.org/configuration-options/
      // 外部化（external）的模块在打包时不会被包含进去，而是在运行时从外部环境获取。globals选项就是用来映射这些外部模块的名称到全局变量的。
      external: ['rxjs'], // devDependencies
      output: [
        {
          format: 'es',
          entryFileNames: 'es/[name].js'
        },
        {
          format: 'cjs',
          entryFileNames: 'lib/[name].cjs'
        }
      ]
    }
  }
})
