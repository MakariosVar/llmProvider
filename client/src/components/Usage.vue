<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <!-- Header -->
    <div class="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-3xl p-8 backdrop-blur-xl">
      <h1 class="text-3xl font-black text-[var(--text-color)] mb-2 tracking-tighter">ANALYTICS & USAGE</h1>
      <p class="text-[var(--text-color)] opacity-70">Comprehensive overview of system performance, quotas, and historical requests.</p>
    </div>

    <!-- Stats Grid -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div v-for="stat in summaryStats" :key="stat.label" class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">{{ stat.label }}</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--text-color)]">{{ stat.value }}</span>
          <span v-if="stat.suffix" class="text-xs font-bold text-[var(--text-color)] opacity-60">{{ stat.suffix }}</span>
        </div>
      </div>
      <!-- Cost Savings Widget -->
      <div class="bg-[var(--accent-bg)] border border-[var(--accent-bg)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--accent-text)] opacity-70 uppercase tracking-[0.2em]">Estimated Savings</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--accent-text)]">${{ estimatedSavings }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Left Column: Chart & Leaderboards -->
        <div class="xl:col-span-1 space-y-8">
            <!-- Chart -->
            <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl">
                <h2 class="text-lg font-bold text-[var(--text-color)] mb-4">Usage Over Time</h2>
                <div class="h-64">
                    <Line :key="chartKey" :data="chartData" :options="chartOptions" />
                </div>
            </div>

            <!-- Tabbed Leaderboards -->
            <div class="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
                <div class="flex border-b border-[var(--border-color)]">
                    <button v-for="tab in ['Tokens', 'Requests', 'Success']" :key="tab" 
                        @click="activeLeaderboard = tab"
                        :class="[
                            'flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors',
                            activeLeaderboard === tab 
                                ? '!bg-[var(--accent-bg)] !text-[var(--accent-text)]' 
                                : 'text-[var(--text-color)] hover:bg-[var(--border-color)]/20'
                        ]">
                        {{ tab }}
                    </button>
                </div>
                <div class="p-6">
                    <ul class="space-y-3">
                        <li v-for="(item, idx) in leaderboardData" :key="idx" class="flex justify-between text-sm">
                            <span class="font-bold text-[var(--text-color)]">{{ item.name }}</span>
                            <span class="text-[var(--text-color)] font-mono">{{ item.value }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Right Column: History Table -->
        <div class="xl:col-span-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div class="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                <h2 class="font-bold text-[var(--text-color)] uppercase text-xs tracking-[0.2em]">Request History</h2>
            </div>
            <div class="flex-1 overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[var(--bg-color)] text-[10px] text-[var(--text-color)] opacity-60 uppercase tracking-widest border-b border-[var(--border-color)]">
                            <th class="p-4">Time</th>
                            <th class="p-4">Provider</th>
                            <th class="p-4">Model</th>
                            <th class="p-4">Latency</th>
                            <th class="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs font-mono">
                        <tr v-for="req in history" :key="req.id" class="border-b border-[var(--border-color)]/30 hover:bg-[var(--accent-bg)]/10 transition-colors">
                            <td class="p-4 text-[var(--text-color)] opacity-60">{{ formatTime(req.timestamp) }}</td>
                            <td class="p-4 text-[var(--accent-bg)] font-bold uppercase">{{ req.provider_id }}</td>
                            <td class="p-4 text-[var(--text-color)]">{{ req.model_name }}</td>
                            <td class="p-4">{{ req.latency }}ms</td>
                            <td class="p-4">
                                <span :class="req.status === 'success' ? 'text-emerald-500' : 'text-rose-500'" class="font-black uppercase">
                                    {{ req.status }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useThemeStore } from '../store'
import axios from 'axios'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const stats = ref(null)
const history = ref([])
const activeLeaderboard = ref('Tokens')
const themeStore = useThemeStore()
const chartKey = ref(0) 

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

const estimatedSavings = computed(() => {
    if (!stats.value || !stats.value.summary) return '0.00'
    const totalTokens = stats.value.summary.totalTokens || 0
    return (totalTokens * 0.0001 * 0.5).toFixed(2)
})

const leaderboardData = computed(() => {
    if (!stats.value || !stats.value.models) return []
    const m = stats.value.models
    if (activeLeaderboard.value === 'Tokens') {
        return m.slice().sort((a, b) => b.total_tokens - a.total_tokens).slice(0, 5).map(m => ({name: m.model_name, value: (m.total_tokens || 0)}))
    }
    if (activeLeaderboard.value === 'Requests') {
        return m.slice().sort((a, b) => b.total - a.total).slice(0, 5).map(m => ({name: m.model_name, value: (m.total || 0)}))
    }
    return m.slice().sort((a, b) => b.success - a.success).slice(0, 5).map(m => ({name: m.model_name, value: (m.success || 0)}))
})

const chartData = computed(() => {
    const isDark = themeStore.isDark
    return {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [{
            label: 'Requests',
            data: [12, 19, 3, 5, 2, 3, 10],
            borderColor: isDark ? '#ffffff' : '#000000',
            tension: 0.1
        }]
    }
})

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }

// Watch theme change and force chart re-render
watch(() => themeStore.isDark, async () => {
    chartKey.value++
    await nextTick()
})

const fetchData = async () => {
  try {
    const [statsRes, historyRes] = await Promise.all([
      axios.get('/api/usage/stats'),
      axios.get('/api/usage/history?limit=20')
    ])
    stats.value = statsRes.data
    history.value = historyRes.data
  } catch (e) {
    console.error('Failed to fetch analytics:', e)
  }
}

const formatTime = (ts) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
    fetchData()
})
</script>
