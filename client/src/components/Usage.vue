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
      <!-- Token Stats Row -->
      <div v-for="stat in tokenStats" :key="stat.label" class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2 border-t-[3px] border-t-[var(--accent-bg)]">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">{{ stat.label }}</span>
        <!-- Dual layout for TPS card -->
        <div v-if="stat.dual" class="flex items-end gap-4">
          <div class="flex flex-col">
            <span class="text-[9px] font-bold text-[var(--text-color)] opacity-40 uppercase tracking-wider">Input</span>
            <span class="text-2xl font-black text-[var(--text-color)] leading-tight">{{ stat.dual.input }}</span>
          </div>
          <span class="text-sm font-black text-[var(--text-color)] opacity-30 pb-0.5">/</span>
          <div class="flex flex-col">
            <span class="text-[9px] font-bold text-[var(--text-color)] opacity-40 uppercase tracking-wider">Output</span>
            <span class="text-2xl font-black text-[var(--text-color)] leading-tight">{{ stat.dual.output }}</span>
          </div>
          <span class="text-xs font-bold text-[var(--text-color)] opacity-60 pb-0.5">tok/s</span>
        </div>
        <!-- Standard layout -->
        <div v-else class="flex items-baseline gap-2">
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
                        <span v-if="opt !== 'Average'" :class="['opacity-70 text-[10px] block truncate', opt === 'Highest' ? '!text-[var(--error-text)]' : '!text-[var(--success-text)]']">
                            {{ opt === 'Highest' ? highestModel : cheapestModel }}
                        </span>
                    </button>
                </div>
                <div class="w-full">
                    <v-select
                      v-model="selectedModel"
                      :options="modelNames"
                      :reduce="model => model.value"
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
                <tbody>
                    <tr>
                        <td class="py-2 px-1">Input Tokens</td>
                        <td class="py-2 px-1">{{ pricingDetails ? pricingDetails.inputTokens.toLocaleString() : '0' }}</td>
                        <td class="py-2 px-1">${{ pricingDetails ? pricingDetails.promptPrice.toFixed(6) : '0.000000' }}</td>
                        <td class="py-2 px-1">${{ pricingDetails ? pricingDetails.inputCost.toFixed(8) : '0.00000000' }}</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-1">Output Tokens</td>
                        <td class="py-2 px-1">{{ pricingDetails ? pricingDetails.outputTokens.toLocaleString() : '0' }}</td>
                        <td class="py-2 px-1">${{ pricingDetails ? pricingDetails.completionPrice.toFixed(6) : '0.000000' }}</td>
                        <td class="py-2 px-1">${{ pricingDetails ? pricingDetails.outputCost.toFixed(8) : '0.00000000' }}</td>
                    </tr>
                    <tr class="border-t border-[var(--accent-text)]/20 font-bold">
                        <td class="py-2 px-1">Rating</td>
                        <td class="py-2 px-1" colspan="3">{{ pricingDetails && !pricingDetails.isAggregate ? ((pricingData.find(p => p.model_name === targetModelName) || {}).rating || 'N/A') + '/10' : 'N/A' }}</td>
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
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold text-[var(--text-color)]">Usage Analysis</h2>
                    <div class="flex gap-1 bg-[var(--border-color)]/10 p-1 rounded-lg">
                        <button v-for="interval in ['minute', 'hour', 'day', 'month']" :key="interval"
                            @click="chartFilters.interval = interval"
                            :class="[
                                'px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors',
                                chartFilters.interval === interval 
                                    ? 'bg-[var(--accent-bg)] text-[var(--accent-text)]' 
                                    : 'text-[var(--text-color)] opacity-60 hover:opacity-100'
                            ]">
                            {{ interval === 'minute' ? '1H' : interval === 'hour' ? '24H' : interval === 'day' ? '7D' : 'Monthly' }}
                        </button>
                    </div>
                </div>

                <div class="flex gap-2 mb-6">
                    <button v-for="metric in ['requests', 'tokens', 'latency']" :key="metric"
                        @click="chartFilters.metric = metric"
                        :class="[
                            'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all',
                            chartFilters.metric === metric 
                                ? 'bg-[var(--accent-bg)] border-[var(--accent-bg)] text-[var(--accent-text)]' 
                                : 'border-[var(--border-color)] text-[var(--text-color)] opacity-40 hover:opacity-100'
                        ]">
                        {{ metric }}
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-6">
                    <select v-model="chartFilters.providerId" class="bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none">
                        <option value="">All Providers</option>
                        <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <select v-model="chartFilters.modelName" class="bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none">
                        <option value="">All Models</option>
                        <option v-for="m in pricingData" :key="m.model_name" :value="m.model_name">{{ m.model_name }}</option>
                    </select>
                </div>

                <div class="h-64">
                    <Line :key="chartKey" :data="chartData" :options="chartOptions" />
                </div>
            </div>

            <!-- Tabbed Leaderboards -->
            <div class="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
                <div class="flex border-b border-[var(--border-color)]">
                    <button v-for="tab in ['Tokens', 'Requests', 'Success', 'Failures']" :key="tab" 
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
            <div class="p-6 border-b border-[var(--border-color)] flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h2 class="font-bold text-[var(--text-color)] uppercase text-xs tracking-[0.2em]">Request History</h2>
                    <div class="text-[10px] text-[var(--text-color)] opacity-60 font-bold uppercase tracking-widest">Total: {{ totalHistory }}</div>
                </div>
                <!-- Filters -->
                <div class="flex flex-wrap gap-3">
                    <input v-model="filters.providerId" placeholder="Filter Provider..." class="flex-1 min-w-[120px] bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-bg)] placeholder:opacity-50" />
                    <input v-model="filters.modelName" placeholder="Filter Model..." class="flex-1 min-w-[120px] bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-bg)] placeholder:opacity-50" />
                    <select v-model="filters.status" class="bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-bg)]">
                        <option value="">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                    </select>
                    
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black opacity-40 uppercase">Sort:</span>
                        <select v-model="filters.sortBy" class="bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-bg)]">
                            <option value="timestamp">Date</option>
                            <option value="latency">Latency</option>
                            <option value="input_tokens">Input</option>
                            <option value="output_tokens">Output</option>
                            <option value="provider_id">Provider</option>
                            <option value="model_name">Model</option>
                        </select>
                        <select v-model="filters.sortOrder" class="bg-[var(--border-color)]/10 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-bg)]">
                            <option value="DESC">DESC</option>
                            <option value="ASC">ASC</option>
                        </select>
                    </div>

                    <button @click="resetFilters" class="px-3 py-2 text-[10px] font-bold uppercase bg-[var(--border-color)]/20 hover:bg-[var(--border-color)]/40 rounded-lg transition-colors">Reset</button>
                </div>
            </div>
            <div class="flex-1 overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr class="bg-[var(--bg-color)] text-[10px] text-[var(--text-color)] opacity-60 uppercase tracking-widest border-b border-[var(--border-color)]">
                            <th class="p-4">Date</th>
                            <th class="p-4">Provider</th>
                            <th class="p-4">Model</th>
                            <th class="p-4">Input</th>
                            <th class="p-4">Output</th>
                            <th class="p-4">Latency</th>
                            <th class="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs font-mono">
                        <tr v-for="req in history" :key="req.id" class="border-b border-[var(--border-color)]/30 hover:bg-[var(--accent-bg)]/10 transition-colors">
                            <td class="p-4 text-[var(--text-color)] opacity-60">{{ formatDate(req.timestamp) }}</td>
                            <td class="p-4 text-[var(--accent-bg)] font-bold uppercase">{{ req.provider_id }}</td>
                            <td class="p-4 text-[var(--text-color)]">{{ req.model_name }}</td>
                            <td class="p-4 text-[var(--text-color)] opacity-70">{{ (req.input_tokens || 0).toLocaleString() }}</td>
                            <td class="p-4 text-[var(--text-color)] opacity-70">{{ (req.output_tokens || 0).toLocaleString() }}</td>
                            <td class="p-4">{{ req.latency }}ms</td>
                            <td class="p-4">
                                <span :class="req.status === 'success' ? 'text-emerald-500' : 'text-rose-500'" class="font-black uppercase">
                                    {{ req.status }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="history.length === 0">
                            <td colspan="7" class="p-12 text-center text-[var(--text-color)] opacity-40 uppercase font-bold tracking-widest text-[10px]">
                                No requests found
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Pagination -->
            <div class="p-4 border-t border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-color)]">
                <div class="text-[10px] text-[var(--text-color)] opacity-60 uppercase font-bold">
                    Page {{ currentPage }} of {{ Math.max(1, Math.ceil(totalHistory / pageSize)) }}
                </div>
                <div class="flex gap-2">
                    <button 
                        @click="currentPage--" 
                        :disabled="currentPage <= 1" 
                        class="px-4 py-2 text-[10px] font-bold uppercase bg-[var(--border-color)]/20 hover:bg-[var(--border-color)]/40 disabled:opacity-30 rounded-lg transition-colors border border-[var(--border-color)]"
                    >
                        Prev
                    </button>
                    <button 
                        @click="currentPage++" 
                        :disabled="currentPage >= Math.ceil(totalHistory / pageSize)" 
                        class="px-4 py-2 text-[10px] font-bold uppercase bg-[var(--border-color)]/20 hover:bg-[var(--border-color)]/40 disabled:opacity-30 rounded-lg transition-colors border border-[var(--border-color)]"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useThemeStore } from '../store'
import axios from 'axios'
import { io } from 'socket.io-client'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const stats = ref(null)
const pricingData = ref([])
const history = ref([])
const totalHistory = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const providers = ref([])

const filters = ref({
    providerId: '',
    modelName: '',
    status: '',
    sortBy: 'timestamp',
    sortOrder: 'DESC'
})

const chartFilters = ref({
    interval: 'hour',
    metric: 'requests',
    providerId: '',
    modelName: ''
})

const timeSeriesData = ref([])
const activeLeaderboard = ref('Tokens')
const selectedModel = ref('Average')
const themeStore = useThemeStore()
const chartKey = ref(0) 
const socket = ref(null)

let debounceTimer = null
const debouncedFetch = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        fetchData()
    }, 500)
}

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
    return [
        { label: 'Average', value: 'Average' },
        ...pricingData.value
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .map(p => ({ label: `${p.model_name} (${p.rating}/10)`, value: p.model_name }))
    ]
})

const summaryStats = computed(() => {
  if (!stats.value || !stats.value.summary) return []
  const s = stats.value.summary
  const rate = s.totalRequests > 0 ? ((s.successRequests / s.totalRequests) * 100).toFixed(1) : 0
  
  return [
    { label: 'Total Executions', value: (s.totalRequests || 0).toLocaleString() },
    { label: 'Successes', value: (s.successRequests || 0).toLocaleString() },
    { label: 'Failures', value: ((s.totalRequests || 0) - (s.successRequests || 0)).toLocaleString() },
    { label: 'Success Rate', value: rate, suffix: '%' },
    { label: 'Avg Latency', value: s.avgLatency || 0, suffix: 'ms' },
  ]
})

const tokenStats = computed(() => {
  if (!stats.value || !stats.value.summary) return []
  const s = stats.value.summary
  const avgInput = s.totalRequests > 0 ? Math.round((s.totalInputTokens || 0) / s.totalRequests) : 0
  const avgOutput = s.totalRequests > 0 ? Math.round((s.totalOutputTokens || 0) / s.totalRequests) : 0
  const latencySec = (s.avgLatency || 0) / 1000
  const inputTps = latencySec > 0 && s.totalRequests > 0 ? (avgInput / latencySec).toFixed(1) : '0'
  const outputTps = latencySec > 0 && s.totalRequests > 0 ? (avgOutput / latencySec).toFixed(1) : '0'

  return [
    { label: 'Total Input Tokens', value: (s.totalInputTokens || 0).toLocaleString() },
    { label: 'Total Output Tokens', value: (s.totalOutputTokens || 0).toLocaleString() },
    { label: 'Avg Input Tokens', value: avgInput.toLocaleString() },
    { label: 'Avg Output Tokens', value: avgOutput.toLocaleString() },
    { label: 'Avg TPS', dual: { input: inputTps, output: outputTps } },
  ]
})

const targetModelName = computed(() => {
    let name = selectedModel.value
    if (selectedModel.value === 'Highest') name = highestModel.value
    if (selectedModel.value === 'Cheapest') name = cheapestModel.value
    return name
})

const pricingDetails = computed(() => {
    if (!stats.value || !stats.value.summary || pricingData.value.length === 0) return null
    
    let targetModelName = selectedModel.value
    if (selectedModel.value === 'Highest') targetModelName = highestModel.value
    if (selectedModel.value === 'Cheapest') targetModelName = cheapestModel.value
    
    const totalInputTokens = stats.value.summary.totalInputTokens || 0
    const totalOutputTokens = stats.value.summary.totalOutputTokens || 0
    
    let modelToLookup = targetModelName
    
    if (selectedModel.value === 'Average') {
        const validPricing = pricingData.value.filter(p => p.prompt_price > 0 && p.completion_price > 0)
        
        let totalPromptPrice = 0
        let totalCompletionPrice = 0
        
        for (const p of validPricing) {
            totalPromptPrice += Number(p.prompt_price)
            totalCompletionPrice += Number(p.completion_price)
        }
        
        const avgPromptPricePer1M = validPricing.length > 0 ? (totalPromptPrice / validPricing.length) * 1000000 : 0
        const avgCompletionPricePer1M = validPricing.length > 0 ? (totalCompletionPrice / validPricing.length) * 1000000 : 0
        
        return {
            isAggregate: true,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            promptPrice: avgPromptPricePer1M,
            completionPrice: avgCompletionPricePer1M,
            inputCost: totalInputTokens * (avgPromptPricePer1M / 1000000),
            outputCost: totalOutputTokens * (avgCompletionPricePer1M / 1000000)
        }
    } else {
        const modelToLookupStr = String(modelToLookup || '').toLowerCase();
        let priceInfo = pricingData.value.find(p => p.model_name.toLowerCase() === modelToLookupStr)
        
        if (!priceInfo) {
            priceInfo = pricingData.value.find(p => 
                p.model_name.toLowerCase().includes(modelToLookupStr) || 
                modelToLookupStr.includes(p.model_name.toLowerCase())
            );
        }

        if (!priceInfo) {
            console.warn(`Pricing not found for model: ${modelToLookupStr}`);
            return null;
        }

        const promptPricePer1M = Number(priceInfo.prompt_price) * 1000000
        const completionPricePer1M = Number(priceInfo.completion_price) * 1000000
        
        return {
            isAggregate: false,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            promptPrice: promptPricePer1M,
            completionPrice: completionPricePer1M,
            inputCost: totalInputTokens * (promptPricePer1M / 1000000),
            outputCost: totalOutputTokens * (completionPricePer1M / 1000000)
        }
    }
})

const estimatedSavings = computed(() => {
    if (pricingDetails.value) {
        return (pricingDetails.value.inputCost + pricingDetails.value.outputCost)
    }
    return 0
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
    if (activeLeaderboard.value === 'Failures') {
        return m.slice().sort((a, b) => (b.total - b.success) - (a.total - a.success)).slice(0, 5).map(m => ({name: m.model_name, value: ((m.total || 0) - (m.success || 0)).toLocaleString()}))
    }
    return m.slice().sort((a, b) => b.success - a.success).slice(0, 5).map(m => ({name: m.model_name, value: (m.success || 0).toLocaleString()}))
})

const chartData = computed(() => {
    const isDark = themeStore.isDark
    const labels = timeSeriesData.value.map(d => {
        if (chartFilters.value.interval === 'hour') {
            return d.label.split(' ')[1] // Just the time
        }
        return d.label
    })
    const data = timeSeriesData.value.map(d => d.value)

    return {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
            label: chartFilters.value.metric.toUpperCase(),
            data: data.length > 0 ? data : [0],
            borderColor: isDark ? '#ffffff' : '#000000',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: isDark ? '#ffffff' : '#000000',
        }]
    }
})

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
                label: (context) => {
                    let label = context.dataset.label || ''
                    if (label) label += ': '
                    if (context.parsed.y !== null) {
                        if (chartFilters.value.metric === 'latency') {
                            label += context.parsed.y.toFixed(0) + 'ms'
                        } else {
                            label += context.parsed.y.toLocaleString()
                        }
                    }
                    return label
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: themeStore.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: themeStore.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
        },
        x: {
            grid: { display: false },
            ticks: { color: themeStore.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
        }
    }
}))

// Watch theme change and force chart re-render
watch(() => themeStore.isDark, async () => {
    chartKey.value++
    await nextTick()
})

const fetchTimeSeries = async () => {
    try {
        const res = await axios.get('/api/usage/timeseries', { params: chartFilters.value })
        timeSeriesData.value = res.data
    } catch (e) {
        console.error('Failed to fetch time series:', e)
    }
}

const fetchHistory = async () => {
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      providerId: filters.value.providerId || undefined,
      modelName: filters.value.modelName || undefined,
      status: filters.value.status || undefined,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder
    }
    const res = await axios.get('/api/usage/history', { params })
    history.value = res.data.data
    totalHistory.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch history:', e)
  }
}

const fetchData = async () => {
  try {
    const [statsRes, pricingRes] = await Promise.all([
      axios.get('/api/usage/stats'),
      axios.get('/api/usage/pricing')
    ])
    stats.value = statsRes.data
    pricingData.value = pricingRes.data
    await Promise.all([
        fetchHistory(),
        fetchTimeSeries()
    ])
  } catch (e) {
    console.error('Failed to fetch analytics:', e)
  }
}

const resetFilters = () => {
    filters.value = {
        providerId: '',
        modelName: '',
        status: '',
        sortBy: 'timestamp',
        sortOrder: 'DESC'
    }
    currentPage.value = 1
}

const formatDate = (ts) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

watch(filters, () => {
    currentPage.value = 1
    fetchHistory()
}, { deep: true })

watch(chartFilters, () => {
    fetchTimeSeries()
}, { deep: true })

watch(currentPage, () => {
    fetchHistory()
})

onMounted(() => {
    fetchData()
    socket.value = io()
    socket.value.on('status_update', (data) => {
        providers.value = data
    })
    socket.value.on('usage_update', () => {
        debouncedFetch()
    })
})

onUnmounted(() => {
    if (socket.value) {
        socket.value.disconnect()
    }
    if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
