<template>
  <div class="space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">System Status</h1>
        <p class="text-slate-400">Live monitoring of infrastructure nodes</p>
      </div>
      <button @click="checkStatus" :disabled="loading" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-all flex items-center gap-2">
        <span v-if="loading" class="animate-spin">◌</span>
        {{ loading ? 'Checking...' : 'Refresh Status' }}
      </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="p-6 bg-white border-2 border-black rounded-[1.5rem] shadow-premium">
        <div class="text-sm font-bold uppercase tracking-widest text-slate-500">Total Nodes</div>
        <div class="text-4xl font-black mt-2">{{ providers.length }}</div>
      </div>
      <div class="p-6 bg-white border-2 border-black rounded-[1.5rem] shadow-premium">
        <div class="text-sm font-bold uppercase tracking-widest text-slate-500">Active Models</div>
        <div class="text-4xl font-black mt-2">{{ activeModelsCount }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="p in providers" :key="p.id" class="p-6 bg-white border-2 border-black rounded-[1.5rem] shadow-premium hover:shadow-none transition-all">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-lg font-bold">{{ p.name }}</h3>
            <span class="text-xs font-mono uppercase tracking-wider">{{ p.id }}</span>
          </div>
          <div class="text-black">
            <svg v-if="p.status === 'online'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            <span v-else-if="p.status === 'error'" class="font-black text-xl">!</span>
            <span v-else class="text-xs font-bold uppercase">{{ p.status }}</span>
          </div>
        </div>
        
        <div class="space-y-3">
          <div v-for="model in p.models" :key="model" class="flex items-center justify-between p-3 border-2 border-black rounded-[1rem]">
            <span class="text-sm font-mono">{{ model }}</span>
            <span class="text-xs font-bold uppercase px-2 py-1 border-2 border-black rounded-[0.5rem]" :class="getModelStatusClass(p.modelStatuses?.[model])">
              {{ p.modelStatuses?.[model]?.status || 'unknown' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import io from 'socket.io-client'

const providers = ref([])
const loading = ref(false)
const socket = io()

socket.on('status_update', (data) => {
  providers.value = data
})

const getStatusClass = (status) => ({
  'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]': status === 'online',
  'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]': status === 'error',
  'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]': status === 'rate_limited',
  'bg-slate-500': status !== 'online' && status !== 'error' && status !== 'rate_limited'
})

const activeModelsCount = computed(() => {
    return providers.value.reduce((acc, p) => acc + (p.models ? p.models.length : 0), 0)
})

const getModelStatusClass = (mStatus) => {
  const status = mStatus?.status
  return {
    'text-emerald-400 border-emerald-900/50 bg-emerald-950/20': status === 'online',
    'text-rose-400 border-rose-900/50 bg-rose-950/20': status === 'error',
    'text-amber-400 border-amber-900/50 bg-amber-950/20': status === 'rate_limited',
    'text-slate-400 border-slate-700 bg-slate-800': !status || status === 'unknown'
  }
}

const checkStatus = async () => {
  loading.value = true
  await fetch('/api/status/check', { method: 'POST' })
  loading.value = false
}
</script>
