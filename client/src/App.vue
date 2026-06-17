<template>
  <div class="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans selection:bg-indigo-500/30">
    <!-- Navbar -->
    <nav v-if="authStore.isAuthenticated" class="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-color)]/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img :src="!themeStore.isDark ? '/logo_white_bg.png' : '/logo_black_bg.png'" alt="Logo" class="h-8 w-8">
          <span class="font-bold text-lg tracking-tight">LLM Provider</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1 bg-[var(--bg-color)] p-1 rounded-xl border border-[var(--border-color)]">
            <router-link v-for="item in navItems" :key="item.path" :to="item.path" 
              active-class="!bg-[var(--accent-bg)] !text-[var(--accent-text)]"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[var(--text-color)] hover:bg-[var(--border-color)]">
              {{ item.name }}
            </router-link>

          </div>
          <ThemeToggle />
          <button @click="logout" class="text-[var(--text-color)] hover:text-rose-400 transition-colors text-sm font-medium">Logout</button>
        </div>
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
import { useAuthStore, useThemeStore } from './store'
import { useRouter } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const navItems = [
  { name: 'System Status', path: '/status' },
  { name: 'Command Center', path: '/chat' },
  { name: 'Model Compare', path: '/compare' },
  { name: 'Imagination', path: '/images' },
  { name: 'Analytics', path: '/usage' },
  { name: 'Quota', path: '/quota' },
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
