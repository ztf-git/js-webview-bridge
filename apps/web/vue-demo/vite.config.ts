import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
  },
  base: './',
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        // 静默 @import 弃用警告
        quietDeps: true,
        // element-plus按需导入时自定义主题 https://element-plus.org/zh-CN/guide/theming.html
        // additionalData: `@use "@/styles/index.scss" as *;`,
      },
    },
  },
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: [
        "vue",
        "pinia",
        "vue-router",
        {
          "naive-ui": [
            "useDialog",
            "useMessage",
            "useNotification",
            "useLoadingBar",
          ],
        },
      ],
      dts: "./src/types/auto-imports.d.ts",
    }),
    Components({
      globs: ["src/components/**/*.vue"], // 自动导入components下所有vue组件 使用该配置是dirs和extensions将会被忽略
      deep: true, // 搜索子目录
      resolvers: [NaiveUiResolver()],
      dts: true,
      include: [/\.vue$/, /\.vue\?vue/, /\.vue\.[tj]sx?\?vue/, /\.md$/],
    })
  ]
})
