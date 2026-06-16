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
