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
      <div class="bg-[var(--accent-bg)] border border-[var(--accent-bg)] p-6 rounded-2xl shadow-xl flex flex-col gap-4 col-span-1 lg:col-span-5 min-w-0">
        <div class="flex justify-between items-center gap-4">
            <div class="flex flex-col gap-1">
                <span class="text-[10px] font-black text-[var(--accent-text)] opacity-70 uppercase tracking-[0.2em]">Estimated Savings</span>
                <span class="text-4xl font-black text-[var(--accent-text)]">${{ estimatedSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 10 }) }}</span>
            </div>
            
            <div class="w-2/3 min-w-[200px] flex flex-col gap-2 text-xs">
                <div class="flex gap-1 bg-[var(--border-color)]/10 p-1 rounded-lg">
                    <button v-for="opt in ['Average', 'Highest', 'Cheapest']" :key="opt"
                        @click="selectedModel = opt"
                        :class="[
                            'flex-1 py-1 px-2 rounded-md transition-colors text-xs font-bold truncate',
                            selectedModel === opt 
                                ? '!bg-[var(--accent-bg)] !text-[var(--accent-text)]' 
                                : 'text-[var(--accent-text)] hover:bg-[var(--accent-text)]/10'
                        ]">
                        {{ opt }}
                        <span v-if="opt !== 'Average'" class="opacity-70 text-[10px] block truncate">
                            {{ opt === 'Highest' ? highestModel : cheapestModel }}
                        </span>
                    </button>
                </div>
                <div class="w-full">
                    <v-select
                      v-model="selectedModel"
                      :options="modelNames"
                      placeholder="Or select specific model..."
                      :clearable="true"
                      :searchable="true"
                      class="style-chooser text-xs font-bold bg-white rounded-lg"
                    >
                    </v-select>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full text-xs text-[var(--accent-text)] font-mono border-collapse">
                <thead>
                    <tr class="text-left border-b border-[var(--accent-text)]/20">
                        <th class="py-2 px-1">Metric</th>
                        <th class="py-2 px-1">Value</th>
                        <th class="py-2 px-1">Price/1M</th>
                        <th class="py-2 px-1">Cost</th>
                    </tr>
                </thead>
                <tbody v-if="pricingDetails">
                    <tr>
                        <td class="py-2 px-1">Input Tokens</td>
                        <td class="py-2 px-1">{{ pricingDetails.inputTokens.toLocaleString() }}</td>
                        <td class="py-2 px-1">${{ pricingDetails.promptPrice.toFixed(6) }}</td>
                        <td class="py-2 px-1">${{ pricingDetails.inputCost.toFixed(8) }}</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-1">Output Tokens</td>
                        <td class="py-2 px-1">{{ pricingDetails.outputTokens.toLocaleString() }}</td>
                        <td class="py-2 px-1">${{ pricingDetails.completionPrice.toFixed(6) }}</td>
                        <td class="py-2 px-1">${{ pricingDetails.outputCost.toFixed(8) }}</td>
                    </tr>
                    <tr class="border-t border-[var(--accent-text)]/20 font-bold">
                        <td class="py-2 px-1" colspan="3">Total Saved</td>
                        <td class="py-2 px-1">${{ estimatedSavings.toFixed(8) }}</td>
                    </tr>
                </tbody>
            </table>
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
const pricingData = ref([])
const history = ref([])
const activeLeaderboard = ref('Tokens')
const selectedModel = ref('Average')
const themeStore = useThemeStore()
const chartKey = ref(0) 

const highestModel = computed(() => {
    if (pricingData.value.length === 0) return 'N/A'
    return pricingData.value.reduce((a, b) => (Number(a.prompt_price) + Number(a.completion_price)) > (Number(b.prompt_price) + Number(b.completion_price)) ? a : b).model_name
})

const cheapestModel = computed(() => {
    if (pricingData.value.length === 0) return 'N/A'
    const valid = pricingData.value.filter(p => p.prompt_price > 0 || p.completion_price > 0)
    if (valid.length === 0) return 'N/A'
    return valid.reduce((a, b) => (Number(a.prompt_price) + Number(a.completion_price)) < (Number(b.prompt_price) + Number(b.completion_price)) ? a : b).model_name
})

const modelNames = computed(() => {
    return pricingData.value.map(p => p.model_name)
})

const summaryStats = computed(() => {
  if (!stats.value || !stats.value.summary) return []
  const s = stats.value.summary
  const rate = s.totalRequests > 0 ? ((s.successRequests / s.totalRequests) * 100).toFixed(1) : 0
  
  return [
    { label: 'Total Executions', value: (s.totalRequests || 0).toLocaleString() },
    { label: 'Success Rate', value: rate, suffix: '%' },
    { label: 'Avg Latency', value: s.avgLatency || 0, suffix: 'ms' },
    { label: 'Input Tokens', value: (s.totalInputTokens || 0).toLocaleString(), suffix: 'est.' },
    { label: 'Output Tokens', value: (s.totalOutputTokens || 0).toLocaleString(), suffix: 'est.' }
  ]
})

const pricingDetails = computed(() => {
    if (!stats.value || !stats.value.summary || pricingData.value.length === 0) return null
    
    let targetModelName = selectedModel.value
    if (selectedModel.value === 'Highest') targetModelName = highestModel.value
    if (selectedModel.value === 'Cheapest') targetModelName = cheapestModel.value
    
    if (selectedModel.value === 'Average') {
        // Calculate global average prices from all models in pricingData
        const validPricing = pricingData.value.filter(p => p.prompt_price > 0 && p.completion_price > 0)
        
        let totalPromptPrice = 0
        let totalCompletionPrice = 0
        
        for (const p of validPricing) {
            totalPromptPrice += Number(p.prompt_price)
            totalCompletionPrice += Number(p.completion_price)
        }
        
        const avgPromptPrice = validPricing.length > 0 ? (totalPromptPrice / validPricing.length) : 0
        const avgCompletionPrice = validPricing.length > 0 ? (totalCompletionPrice / validPricing.length) : 0
        
        const inputTokens = stats.value.summary.totalInputTokens || 0
        const outputTokens = stats.value.summary.totalOutputTokens || 0
        
        return {
            isAggregate: true,
            inputTokens,
            outputTokens,
            promptPrice: avgPromptPrice * 1000000,
            completionPrice: avgCompletionPrice * 1000000,
            inputCost: inputTokens * avgPromptPrice,
            outputCost: outputTokens * avgCompletionPrice
        }
    } else {
        const priceInfo = pricingData.value.find(p => p.model_name === targetModelName)
        if (!priceInfo) return null

        const inputTokens = stats.value.summary.totalInputTokens || 0
        const outputTokens = stats.value.summary.totalOutputTokens || 0
        const promptPrice = Number(priceInfo.prompt_price) || 0
        const completionPrice = Number(priceInfo.completion_price) || 0
        
        return {
            isAggregate: false,
            inputTokens,
            outputTokens,
            promptPrice: promptPrice * 1000000,
            completionPrice: completionPrice * 1000000,
            inputCost: inputTokens * promptPrice,
            outputCost: outputTokens * completionPrice
        }
    }
})

const estimatedSavings = computed(() => {
    if (pricingDetails.value) {
        return (pricingDetails.value.inputCost + pricingDetails.value.outputCost)
    }
    
    // Fallback for 'Average'
    if (!stats.value || !stats.value.summary || pricingData.value.length === 0) return 0
    let totalSavings = 0
    for (const m of stats.value.models || []) {
        const priceInfo = pricingData.value.find(p => p.model_name === m.model_name)
        if (priceInfo) {
            const inputCost = (m.total_input_tokens || 0) * Number(priceInfo.prompt_price) / 1000000
            const outputCost = (m.total_output_tokens || 0) * Number(priceInfo.completion_price) / 1000000
            totalSavings += (inputCost + outputCost)
        }
    }
    return totalSavings
})

const leaderboardData = computed(() => {
    if (!stats.value || !stats.value.models) return []
    const m = stats.value.models
    if (activeLeaderboard.value === 'Tokens') {
        return m.slice().sort((a, b) => (b.total_input_tokens + b.total_output_tokens) - (a.total_input_tokens + a.total_output_tokens)).slice(0, 5).map(m => ({name: m.model_name, value: ((m.total_input_tokens || 0) + (m.total_output_tokens || 0)).toLocaleString()}))
    }
    if (activeLeaderboard.value === 'Requests') {
        return m.slice().sort((a, b) => b.total - a.total).slice(0, 5).map(m => ({name: m.model_name, value: (m.total || 0).toLocaleString()}))
    }
    return m.slice().sort((a, b) => b.success - a.success).slice(0, 5).map(m => ({name: m.model_name, value: (m.success || 0).toLocaleString()}))
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
    const [statsRes, historyRes, pricingRes] = await Promise.all([
      axios.get('/api/usage/stats'),
      axios.get('/api/usage/history?limit=20'),
      axios.get('/api/usage/pricing')
    ])
    stats.value = statsRes.data
    history.value = historyRes.data
    pricingData.value = pricingRes.data
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
