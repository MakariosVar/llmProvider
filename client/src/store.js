import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: sessionStorage.getItem('isAuthenticated') === 'true'
  }),
  actions: {
    login() {
      sessionStorage.setItem('isAuthenticated', 'true')
      this.isAuthenticated = true
    },
    logout() {
      sessionStorage.removeItem('isAuthenticated')
      this.isAuthenticated = false
    }
  }
})

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: localStorage.getItem('isDark') === 'true'
  }),
  actions: {
    toggleTheme() {
      this.isDark = !this.isDark
      localStorage.setItem('isDark', this.isDark)
      this.applyTheme()
    },
    applyTheme() {
      if (this.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
})

export const useMonitorStore = defineStore('monitor', {
  state: () => ({
    isActive: false,
    previousPath: '/status'
  }),
  actions: {
    toggle(currentPath) {
      if (this.isActive) {
        this.deactivate()
      } else {
        this.activate(currentPath)
      }
    },
    activate(currentPath) {
      this.previousPath = currentPath;
      this.isActive = true;
    },
    deactivate() {
      this.isActive = false;
    }
  }
})
