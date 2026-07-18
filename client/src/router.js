import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Status from './components/Status.vue'
import Chat from './components/Chat.vue'
import Compare from './components/Compare.vue'
import Images from './components/Images.vue'
import TestAPI from './components/TestAPI.vue'
import DocsPage from './components/DocsPage.vue'
import Usage from './components/Usage.vue'
import Quota from './components/Quota.vue'
import NotFound from './components/NotFound.vue'
import { useAuthStore } from './store'
import Settings from './components/Settings.vue'

const routes = [
  { path: '/', redirect: '/status' },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/status', component: Status, meta: { requiresAuth: true } },
  { path: '/chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/compare', component: Compare, meta: { requiresAuth: true } },
  { path: '/images', component: Images, meta: { requiresAuth: true } },
  { path: '/test-api', component: TestAPI, meta: { requiresAuth: true } },
  { path: '/docs', component: DocsPage, meta: { requiresAuth: true } },
  { path: '/usage', component: Usage, meta: { requiresAuth: true } },
  { path: '/quota', component: Quota, meta: { requiresAuth: true } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/status')
  } else {
    next()
  }
})

export default router
