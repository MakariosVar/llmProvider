<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <!-- Header -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
      <h1 class="text-3xl font-black text-white mb-2 tracking-tighter">ANALYTICS & USAGE</h1>
      <p class="text-slate-400">Comprehensive overview of system performance, quotas, and historical requests.</p>
    </div>

    <!-- Stats Grid -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in summaryStats" :key="stat.label" class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{{ stat.label }}</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-white">{{ stat.value }}</span>
          <span v-if="stat.suffix" class="text-xs font-bold text-slate-600">{{ stat.suffix }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Providers/Models Stats -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
          <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span class="w-1 h-4 bg-indigo-500 rounded-full"></span>
            Provider Distribution
          </h2>
          <div class="space-y-4">
            <div v-for="p in stats?.providers" :key="p.provider_id" class="flex flex-col gap-2">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-slate-300 uppercase">{{ p.provider_id }}</span>
                <span class="text-slate-500">{{ p.total }} reqs</span>
              </div>
              <div class="h-1.5 bg-slate-950 rounded-full overflow-hidden flex">
                <div :style="{ width: (p.success / p.total * 100) + '%' }" class="bg-emerald-500 h-full"></div>
                <div :style="{ width: ((p.total - p.success) / p.total * 100) + '%' }" class="bg-rose-500 h-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
          <h3 class="font-bold text-indigo-300 mb-4 uppercase text-xs tracking-widest">Latency Efficiency</h3>
          <div class="space-y-4">
            <div v-for="m in topModels" :key="m.model_name" class="flex justify-between items-center text-xs">
              <span class="text-slate-400 font-mono truncate mr-4">{{ m.model_name }}</span>
              <span class="text-white font-black">{{ Math.round(m.avg_latency) }}ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div class="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <h2 class="font-bold text-white uppercase text-xs tracking-[0.2em]">Request History</h2>
            <div class="flex gap-2">
                <input v-model="filter" placeholder="Filter history..." class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500" />
                <button @click="refresh" class="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>
        <div class="flex-1 overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950 text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <th class="p-4">Time</th>
                <th class="p-4">Provider</th>
                <th class="p-4">Model</th>
                <th class="p-4">Latency</th>
                <th class="p-4">Status</th>
              </tr>
            </thead>
            <tbody class="text-xs font-mono">
              <tr v-for="req in filteredHistory" :key="req.id" class="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                <td class="p-4 text-slate-500">{{ formatTime(req.timestamp) }}</td>
                <td class="p-4 text-indigo-400 font-bold uppercase">{{ req.provider_id }}</td>
                <td class="p-4 text-slate-300">{{ req.model_name }}</td>
                <td class="p-4" :class="getLatencyClass(req.latency)">{{ req.latency }}ms</td>
                <td class="p-4">
                  <span :class="req.status === 'success' ? 'text-emerald-500' : 'text-rose-500'" class="font-black uppercase">
                    {{ req.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredHistory.length === 0" class="text-center text-slate-600 italic">
                <td colspan="5" class="p-8">No requests found matching your criteria</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const stats = ref(null)
const history = ref([])
const filter = ref('')
const loading = ref(false)

const summaryStats = computed(() => {
  if (!stats.value || !stats.value.summary) return []
  const s = stats.value.summary
  const rate = s.totalRequests > 0 ? ((s.successRequests / s.totalRequests) * 100).toFixed(1) : 0
  
  return [
    { label: 'Total Executions', value: (s.totalRequests || 0).toLocaleString() },
    { label: 'Success Rate', value: rate, suffix: '%' },
    { label: 'Avg Latency', value: s.avgLatency || 0, suffix: 'ms' },
    { label: 'Total Tokens', value: (s.totalTokens || 0).toLocaleString(), suffix: 'est.' }
  ]
})

const topModels = computed(() => {
  if (!stats.value || !stats.value.models) return []
  return [...stats.value.models]
    .filter(m => m.success > 0)
    .sort((a, b) => a.avg_latency - b.avg_latency)
    .slice(0, 5)
})

const filteredHistory = computed(() => {
  if (!filter.value) return history.value
  const f = filter.value.toLowerCase()
  return history.value.filter(h => 
    h.provider_id.toLowerCase().includes(f) || 
    h.model_name.toLowerCase().includes(f) ||
    h.status.toLowerCase().includes(f)
  )
})

const fetchData = async () => {
  try {
    loading.value = true
    const [statsRes, historyRes] = await Promise.all([
      axios.get('/api/usage/stats'),
      axios.get('/api/usage/history?limit=100')
    ])
    stats.value = statsRes.data
    history.value = historyRes.data
  } catch (e) {
    console.error('Failed to fetch analytics:', e)
  } finally {
    loading.value = false
  }
}

const refresh = () => fetchData()

const formatTime = (ts) => {
  if (!ts) return '-'
  const date = new Date(ts)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getLatencyClass = (lat) => {
  if (lat < 500) return 'text-emerald-400'
  if (lat < 2000) return 'text-amber-400'
  return 'text-rose-400'
}

onMounted(() => fetchData())
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
</style>
