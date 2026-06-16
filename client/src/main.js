import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useThemeStore } from './store'
import router from './router'
import './style.css'
import './theme.css'
import App from './App.vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const app = createApp(App)
app.component('v-select', vSelect)
app.use(createPinia())

const themeStore = useThemeStore()
themeStore.applyTheme()

app.use(router)
app.mount('#app')
