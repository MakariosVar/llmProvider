<template>
  <div class="flex items-center justify-center h-[calc(100vh-4rem)]">
    <div class="w-full max-w-sm p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
      <div class="mb-8 text-center">
        <h2 class="text-2xl font-bold text-white mb-2">Access Panel</h2>
        <p class="text-slate-400 text-sm">Enter credentials</p>
      </div>
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <input v-model="username" placeholder="Username" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        </div>
        <div>
          <input v-model="password" type="password" placeholder="Password" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        </div>
        <button type="submit" class="w-full py-3 !bg-[var(--accent-bg)] !text-[var(--accent-text)] font-bold rounded-xl transition-all shadow-lg active:scale-95 border-2 border-[var(--border-color)]">
          Sign In
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import axios from 'axios'

const username = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore()

const login = async () => {
  try {
    const response = await axios.post('/api/login', {
      username: username.value,
      password: password.value
    })
    
    if (response.data.success) {
      sessionStorage.setItem('authToken', response.data.token)
      authStore.login()
      router.push('/status')
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Unauthorized Access')
  }
}
</script>
