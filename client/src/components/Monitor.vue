<template>
  <div v-if="!providers || !providers.length" style="height: 100vh;">
    <!-- bootstrap loader  -->
    <div class="flex items-center justify-center h-full">
      <div class="flex items-center gap-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span class="text-white"></span>
      </div>
    </div>

  </div>
  <div v-else style="font-size:2rem !important" class="bg-black text-gray-200 font-mono h-full overflow-hidden flex flex-col p-[2px] text-[9px] leading-[1.3]">
    <div class="flex items-center justify-between shrink-0">
      <button @click="monitorStore.deactivate()" class="text-gray-600 hover:text-white transition-colors no-underline">&larr; back</button>
      <span class="text-gray-500">{{ now }}</span>
    </div>
    <div class="text-gray-600 border-b border-gray-800 shrink-0">
      MONITOR — real-time overview
    </div>

    <div class="shrink-0 min-h-0 overflow-hidden mt-[1px]">
      <div class="text-gray-500 uppercase tracking-wider mb-0 shrink-0">Summary</div>
      <div><span class="text-gray-500 inline-block w-[5.5em] shrink-0">requests</span><span class="text-white">{{ summary.totalRequests }}</span></div>
      <div><span class="text-gray-500 inline-block w-[5.5em] shrink-0">success</span><span class="text-green-400">{{ summary.successRequests }}</span><span class="text-gray-600 ml-1">({{ successRate }}%)</span></div>
      <div><span class="text-gray-500 inline-block w-[5.5em] shrink-0">failures</span><span class="text-red-400">{{ summary.failedRequests }}</span></div>
      <div><span class="text-gray-500 inline-block w-[5.5em] shrink-0">in tok</span><span class="text-white">{{ formatNum(summary.totalInputTokens) }}</span></div>
      <div><span class="text-gray-500 inline-block w-[5.5em] shrink-0">out tok</span><span class="text-white">{{ formatNum(summary.totalOutputTokens) }}</span></div>
      <div><span class="text-gray-500 inline-block w-[5.5em] shrink-0">latency</span><span class="text-white">{{ summary.avgLatency }}ms</span></div>
    </div>

    <div class="flex flex-col min-h-0 overflow-hidden mt-[1px]">
      <div class="text-gray-500 uppercase tracking-wider mb-0 shrink-0">Providers</div>
      <div class="overflow-hidden">
        <div v-for="p in providers" :key="p.id" class="flex items-baseline flex-nowrap gap-x-1 whitespace-nowrap overflow-hidden">
          <span class="text-white font-bold min-w-[4em] shrink-0">{{ p.id }}</span>
          <span :class="getProviderDotClass(p)" class="shrink-0">●</span>
          <span :class="getProviderStatusClass(p)" class="uppercase font-bold shrink-0">{{ getProviderStatus(p) }}</span>
          <span class="text-gray-500 shrink-0 ml-[2px]" v-if="getLiveRateStr(p)">{{ getLiveRateStr(p) }}</span>
          <span class="text-gray-600 shrink-0 ml-[2px]">{{ p.usage?.requestsToday || 0 }} today</span>
        </div>
        <div v-if="providers.length === 0" class="text-gray-700">waiting for data...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import io from 'socket.io-client'
import { useMonitorStore } from '../store'

const monitorStore = useMonitorStore()
const stats = ref(null)
const providers = ref([])
const now = ref('')
let socket = null
let clockInterval = null

const summary = computed(() => {
  if (!stats.value?.summary) return { totalRequests: 0, successRequests: 0, failedRequests: 0, totalInputTokens: 0, totalOutputTokens: 0, avgLatency: 0 }
  const s = stats.value.summary
  return {
    totalRequests: (s.totalRequests || 0).toLocaleString(),
    successRequests: (s.successRequests || 0).toLocaleString(),
    failedRequests: ((s.totalRequests || 0) - (s.successRequests || 0)).toLocaleString(),
    totalInputTokens: s.totalInputTokens || 0,
    totalOutputTokens: s.totalOutputTokens || 0,
    avgLatency: s.avgLatency || 0
  }
})

const successRate = computed(() => {
  if (!stats.value?.summary?.totalRequests) return '0.0'
  const s = stats.value.summary
  return ((s.successRequests || 0) / s.totalRequests * 100).toFixed(1)
})

const formatNum = (n) => {
  if (!n && n !== 0) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString()
}

const getProviderStatus = (p) => {
  const statuses = Object.values(p.modelStatuses || {})
  if (statuses.some(m => m.status === 'online')) return 'online'
  if (statuses.some(m => m.status === 'rate_limited')) return 'limited'
  if (statuses.some(m => m.status === 'error')) return 'error'
  return 'unknown'
}

const getProviderDotClass = (p) => {
  const s = getProviderStatus(p)
  if (s === 'online') return 'text-green-400'
  if (s === 'error') return 'text-red-400'
  if (s === 'limited') return 'text-yellow-400'
  return 'text-gray-600'
}

const getProviderStatusClass = (p) => getProviderDotClass(p)

const getLiveRateStr = (p) => {
  const limits = p.liveRateLimits
  if (!limits || Object.keys(limits).length === 0) return ''
  const firstKey = Object.keys(limits)[0]
  const lr = limits[firstKey]
  if (!lr) return ''
  const parts = []
  if (lr.requestsLimit != null && lr.requestsRemaining != null) {
    parts.push(`${lr.requestsRemaining}/${lr.requestsLimit} req`)
  }
  if (lr.tokensLimit != null && lr.tokensRemaining != null) {
    const fmt = (v) => v >= 1000 ? Math.round(v / 1000) + 'k' : v
    parts.push(`${fmt(lr.tokensRemaining)}/${fmt(lr.tokensLimit)} tok`)
  }
  return parts.length > 0 ? parts.join('\u00B7') : ''
}

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/usage/stats')
    stats.value = res.data
  } catch (e) {
    // silent
  }
}

onMounted(() => {
  fetchStats()
  socket = io()
  socket.on('status_update', (data) => {
    providers.value = data
  })
  socket.on('usage_update', () => {
    fetchStats()
  })
  const tick = () => { now.value = new Date().toLocaleTimeString() }
  tick()
  clockInterval = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (socket) socket.disconnect()
  if (clockInterval) clearInterval(clockInterval)
})
</script>
