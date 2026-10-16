<template>
  <Monitor v-if="monitorStore.isActive" />
  <div v-else class="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans selection:bg-indigo-500/30">
    <!-- Navbar -->
    <nav v-if="authStore.isAuthenticated && !route.meta?.hideNav" class="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-color)]/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img :src="!themeStore.isDark ? '/logo_white_bg_trnsp.png' : '/logo_black_bg_trnsp.png'" alt="Logo" class="h-8 w-8">
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          <div class="hidden md:flex items-center gap-1 bg-[var(--bg-color)] p-1 rounded-xl border border-[var(--border-color)]">
            <router-link v-for="item in navItems" :key="item.path" :to="item.path" 
              active-class="!bg-[var(--accent-bg)] !text-[var(--accent-text)]"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 text-[var(--text-color)] hover:bg-[var(--border-color)] whitespace-nowrap">
              {{ item.name }}
            </router-link>
          </div>
          
          <div class="md:hidden flex items-center gap-1 bg-[var(--bg-color)] p-1 rounded-xl border border-[var(--border-color)]">
            <router-link v-for="(item, index) in displayNavItems" :key="item.path" :to="item.path" 
              active-class="!bg-[var(--accent-bg)] !text-[var(--accent-text)]"
              class="px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-[var(--text-color)] hover:bg-[var(--border-color)] whitespace-nowrap">
              {{ item.name }}
            </router-link>
          </div>
          <a
            href="https://github.com/makariosvar/llmProvider"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            class="p-2 border-2 border-[var(--border-color)] rounded-full bg-[var(--bg-color)] text-[var(--text-color)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--accent-text)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 .297a12 12 0 0 0-3.794 23.383c.6.111.82-.26.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 0 1 6.006 0c2.29-1.553 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.805 5.622-5.476 5.921.43.372.814 1.103.814 2.222v3.293c0 .32.216.694.825.576A12 12 0 0 0 12 .297Z"
              />
            </svg>
          </a>
          <ThemeToggle />
          <button @click="logout" class="text-[var(--text-color)] hover:text-rose-400 transition-colors text-sm font-medium hidden sm:block">Logout</button>
        </div>
      </div>
    </nav>

    <main :class="route.meta?.hideNav ? 'h-dvh overflow-hidden' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore, useThemeStore, useMonitorStore } from './store'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted, onUnmounted } from 'vue'
import ThemeToggle from './components/ThemeToggle.vue'
import Monitor from './components/Monitor.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const monitorStore = useMonitorStore()

const router = useRouter()
const route = useRoute()
const navItems = [
  { name: 'Status', path: '/status' },
  { name: 'Chat', path: '/chat' },
  { name: 'Compare', path: '/compare' },
  { name: 'Images', path: '/images' },
  { name: 'Speech', path: '/speech' },
  { name: 'Usage', path: '/usage' },
  { name: 'Quota', path: '/quota' },
  { name: 'API', path: '/test-api' },
  { name: 'Docs', path: '/docs' },
  { name: 'Settings', path: '/settings' },
]

const displayNavItems = computed(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return navItems.slice(0, 5)
  }
  return navItems
})

const handleKeydown = (e) => {
  if (e.ctrlKey && e.key === 'm') {
    e.preventDefault();
    if (authStore.isAuthenticated) {
      monitorStore.toggle(route.fullPath);
      if (!monitorStore.isActive) {
        router.push(monitorStore.previousPath)
      }
    }
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
