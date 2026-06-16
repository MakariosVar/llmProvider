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
      <div class="p-6 bg-white border-2 border-black rounded-[1.5rem] shadow-premium">
        <div class="text-sm font-bold uppercase tracking-widest text-emerald-600">Healthy</div>
        <div class="text-4xl font-black mt-2 text-emerald-600">{{ healthyModelsCount }}</div>
      </div>
      <div class="p-6 bg-white border-2 border-black rounded-[1.5rem] shadow-premium">
        <div class="text-sm font-bold uppercase tracking-widest text-rose-600">Failing</div>
        <div class="text-4xl font-black mt-2 text-rose-600">{{ failingModelsCount }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="p in providers" :key="p.id" class="p-6 bg-white border-2 border-black rounded-[1.5rem] shadow-premium hover:shadow-none transition-all">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-lg font-bold">{{ p.name }}</h3>
            <span class="text-xs font-mono uppercase tracking-wider">{{ p.id }}</span>
          </div>
          <div class="w-4 h-4 rounded-full" :class="getProviderStatusClass(p)"></div>
        </div>
        
        <div class="space-y-3">
          <div v-for="model in p.models" :key="model" class="flex items-center justify-between p-3 border-2 border-black rounded-[1rem]">
            <span class="text-sm font-mono">{{ model }}</span>
            <span class="text-xs font-bold uppercase px-2 py-1 border-2 rounded-[0.5rem]"
                  :class="getModelStatusClass(p.modelStatuses?.[model])">
              {{ (p.modelStatuses?.[model]?.status || 'unknown').toUpperCase() }}
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

const activeModelsCount = computed(() => {
    return providers.value.reduce((acc, p) => acc + (p.models ? p.models.length : 0), 0)
})

const healthyModelsCount = computed(() => {
    return providers.value.reduce((acc, p) => 
        acc + Object.values(p.modelStatuses || {}).filter(m => m.status === 'online').length, 0)
})

const failingModelsCount = computed(() => {
    return providers.value.reduce((acc, p) => 
        acc + Object.values(p.modelStatuses || {}).filter(m => m.status === 'error').length, 0)
})

const getProviderStatusClass = (p) => {
    const statuses = Object.values(p.modelStatuses || {})
    if (statuses.some(m => m.status === 'error')) return 'bg-red-500' // Changed to red
    if (statuses.some(m => m.status === 'rate_limited')) return 'bg-yellow-500' // Changed to yellow
    if (statuses.every(m => m.status === 'online')) return 'bg-green-500' // Changed to green
    return 'bg-slate-500'
}

const getModelStatusClass = (mStatus) => {
  const status = (mStatus?.status || '').toLowerCase()

  if (status === 'online') return 'status-online'
  if (status === 'error') return 'status-error'
  if (status === 'rate_limited') return 'status-rate-limited'
  return 'status-default'
}
const checkStatus = async () => {
  loading.value = true
  await fetch('/api/status/check', { method: 'POST' })
  loading.value = false
}
</script>
