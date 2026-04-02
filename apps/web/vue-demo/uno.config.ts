import { defineConfig, presetWind4, presetAttributify } from "unocss";
export default defineConfig({
  // ...UnoCSS options
  content: {
    filesystem: ["./src/**/*.{vue,ts,js,jsx,tsx,html}"],
  },
  theme: {
    // 自定义主题变量，与 Naive UI 主题同步
    colors: {
      primary: "#818cf8",
    },
    fontFamily: {
      sans: ['"Helvetica Neue"', "Arial", "sans-serif"],
    },
    // …还可扩展 spacing, borderRadius 等
  },
  presets: [presetWind4(), presetAttributify()],
  shortcuts: {
    // 快捷类名，便于统一布局
    btn: "px-4 py-2 rounded text-white bg-primary hover:bg-primary-600",
    "card-base": "p-4 bg-white dark:bg-gray-800 rounded-lg shadow",
  },
});