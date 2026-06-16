<template>
  <div class="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
    <!-- Navbar -->
    <nav v-if="authStore.isAuthenticated" class="sticky top-0 z-50 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-bold text-lg tracking-tight">LLM Provider</span>
        </div>
        <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <router-link v-for="item in navItems" :key="item.path" :to="item.path" 
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="$route.path === item.path ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'">
            {{ item.name }}
          </router-link>
        </div>
        <button @click="logout" class="text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium">Logout</button>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const navItems = [
  { name: 'System Status', path: '/status' },
  { name: 'Command Center', path: '/chat' },
  { name: 'Model Compare', path: '/compare' },
  { name: 'Test API', path: '/test-api' }
]

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
