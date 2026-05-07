import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { applyDesignTokens } from './styles/applyTokens'
import './styles/main.css'

applyDesignTokens()

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
