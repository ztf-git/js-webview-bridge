import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import 'virtual:uno.css'
// 通用字体
import 'vfonts/Lato.css'
const app = createApp(App)
app.use(router)
app.mount('#app')
