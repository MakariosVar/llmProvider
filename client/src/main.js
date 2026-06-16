import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import './theme.css'
import App from './App.vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const app = createApp(App)
app.component('v-select', vSelect)
app.use(createPinia())
app.use(router)
app.mount('#app')
