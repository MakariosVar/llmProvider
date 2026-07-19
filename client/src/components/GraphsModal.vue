<template>
  <!-- Modal Overlay Backdrop -->
  <div v-if="isOpen" class="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" @click.self="$emit('update:isOpen', false)">
    <!-- Modal Container: Solid background, theme-aware -->
    <div class="!bg-[var(--bg-color)] border-2 !border-[var(--border-color)] rounded-3xl p-6 w-full max-w-7xl max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-black text-[var(--text-color)] tracking-tighter uppercase">Enterprise Analytics</h2>
        <button @click="$emit('update:isOpen', false)" class="text-[var(--text-color)] opacity-50 hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Row 1: Advanced Analysis (Traffic Trend) -->
        <div class="lg:col-span-4 bg-[var(--border-color)]/10 p-4 rounded-xl h-80 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-[10px] font-black opacity-50 uppercase tracking-widest">Traffic Trend</h3>
            <div class="flex gap-2">
                <button v-for="metric in ['requests', 'tokens', 'latency']" :key="metric"
                    @click="localFilters.metric = metric"
                    :class="['px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors', localFilters.metric === metric ? '!bg-[var(--accent-bg)] !text-[var(--accent-text)]' : '!bg-[var(--bg-color)] !text-[var(--text-color)] !hover:bg-[var(--border-color)]']">
                    {{ metric }}
                </button>
                <div class="w-px h-6 !bg-[var(--border-color)] mx-2"></div>
                <button v-for="interval in ['minute', 'hour', 'day', 'month']" :key="interval"
                    @click="localFilters.interval = interval"
                    :class="['px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors', localFilters.interval === interval ? '!bg-[var(--accent-bg)] !text-[var(--accent-text)]' : '!bg-[var(--bg-color)] !text-[var(--text-color)] !hover:bg-[var(--border-color)]']">
                    {{ interval === 'minute' ? '1H' : interval === 'hour' ? '24H' : interval === 'day' ? '7D' : 'Monthly' }}
                </button>
            </div>
          </div>
          <div class="flex-1 min-h-0">
            <Line :key="chartKey + '-deep-dive'" :data="themeAwareDeepDiveChartData" :options="getThemeOptions({ legend: { display: false } })" />
          </div>
        </div>

        <!-- Row 2: Success Rate, Provider Distribution, Token Consumption -->
        <!-- Success Rate -->
        <div class="bg-[var(--border-color)]/10 p-4 rounded-xl h-56 flex flex-col items-center">
          <h3 class="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 w-full text-center">Success Rate</h3>
          <div class="flex-1 w-full max-w-[120px] max-h-[200px] flex items-center justify-center">
            <Doughnut :data="successRateData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" />
          </div>
        </div>
        <div class="bg-[var(--border-color)]/10 p-4 rounded-xl h-56 flex flex-col">
            <h3 class="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Provider Distribution</h3>
            <div class="flex-1 w-full min-h-0">
                <Doughnut :data="themeAwareProviderDistribution" :options="getThemeOptions({ legend: { position: 'right', labels: { boxWidth: 6, font: { size: 7 } } } })" />
            </div>
        </div>

        <div class="lg:col-span-2 bg-[var(--border-color)]/10 p-4 rounded-xl h-56 flex flex-col">
          <h3 class="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Token Consumption</h3>
          <div class="flex-1 min-h-0">
            <Bar :data="themeAwareTokenConsumption" :options="getThemeOptions({ legend: { display: false } })" />
          </div>
        </div>

        <!-- Row 3: Latency Distribution & Top Models -->
        <div class="lg:col-span-2 bg-[var(--border-color)]/10 p-4 rounded-xl h-48 flex flex-col">
            <h3 class="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Latency Distribution</h3>
            <div class="flex-1 min-h-0">
                <Bar :data="latencyDistributionData" :options="getThemeOptions({ legend: { display: false } })" />
            </div>
        </div>

        <div class="lg:col-span-2 bg-[var(--border-color)]/10 p-4 rounded-xl h-48 flex flex-col">
          <h3 class="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Top Models (Latency)</h3>
          <div class="flex-1 overflow-y-auto custom-scrollbar">
              <table class="w-full text-xs text-[var(--text-color)]">
                  <tr v-for="model in topModels" :key="model.name" class="border-b border-[var(--border-color)]/20">
                      <td class="py-1 font-mono truncate max-w-[180px]">{{ model.name }}</td>
                      <td class="py-1 text-right font-black">{{ model.latency }}ms</td>
                  </tr>
              </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useThemeStore } from '../store'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const props = defineProps(['isOpen', 'stats', 'chartData', 'chartKey', 'providers', 'chartFilters', 'timeSeriesData'])
const emit = defineEmits(['update:isOpen', 'update:chartFilters'])
const themeStore = useThemeStore()

const localFilters = computed({
    get: () => props.chartFilters,
    set: (value) => emit('update:chartFilters', value)
})

const providerMap = computed(() => {
    const map = new Map()
    if (props.providers) {
        props.providers.forEach(p => map.set(p.id, p.name))
    }
    return map
})

const getProviderName = (providerId) => {
    return providerMap.value.get(providerId) || providerId
}

const getThemeColors = () => {
    const isDark = themeStore.isDark
    return {
        text: isDark ? '#ffffff' : '#000000',
        line: isDark ? '#ffffff' : '#000000',
        barInput: isDark ? '#4f46e5' : '#6366f1',
        barOutput: isDark ? '#9333ea' : '#a855f7',
        latency: isDark ? '#7c3aed' : '#8b5cf6'
    }
}

const getThemeOptions = (overrides = {}) => {
    const colors = getThemeColors()
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: colors.text } },
            y: { beginAtZero: true, ticks: { color: colors.text } }
        },
        plugins: {
            legend: { 
                labels: { color: colors.text },
                onClick: null,
                ...overrides.legend 
            }
        }
    }
}

const themeAwareDeepDiveChartData = computed(() => {
    const colors = getThemeColors()
    const labels = props.timeSeriesData.map(d => d.label)
    const data = props.timeSeriesData.map(d => d.value)
    return {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
            label: localFilters.value.metric.toUpperCase(),
            data: data.length > 0 ? data : [0],
            borderColor: colors.line,
            backgroundColor: 'transparent',
            pointBackgroundColor: colors.line,
            tension: 0.4
        }]
    }
})

const successRateData = computed(() => {
    if (!props.stats || !props.stats.summary) return { labels: ['N/A'], datasets: [{ data: [1], backgroundColor: ['#94a3b8'] }] }
    const s = props.stats.summary
    const total = s.totalRequests || 0
    const success = s.successRequests || 0
    return {
        labels: ['Success', 'Error'],
        datasets: [{
            data: [success, total - success],
            backgroundColor: ['#10b981', '#f43f5e']
        }]
    }
})

const themeAwareProviderDistribution = computed(() => {
    if (!props.stats || !props.stats.providers || props.stats.providers.length === 0) return { labels: ['N/A'], datasets: [{ data: [1], backgroundColor: ['#94a3b8'] }] }
    const providers = props.stats.providers
    return {
        labels: providers.map(p => getProviderName(p.provider_id)),
        datasets: [{
            data: providers.map(p => p.total || 0),
            backgroundColor: ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308']
        }]
    }
})

const themeAwareTokenConsumption = computed(() => {
    if (!props.stats || !props.stats.summary) return { labels: ['N/A'], datasets: [{ label: 'N/A', data: [0] }] }
    const s = props.stats.summary
    const colors = getThemeColors()
    return {
        labels: ['Tokens'],
        datasets: [
            { label: 'Input', data: [s.totalInputTokens || 0], backgroundColor: colors.barInput },
            { label: 'Output', data: [s.totalOutputTokens || 0], backgroundColor: colors.barOutput }
        ]
    }
})

const latencyDistributionData = computed(() => {
    if (!props.stats || !props.stats.models) return { labels: ['N/A'], datasets: [{ data: [0], backgroundColor: ['#94a3b8'] }] }
    const colors = getThemeColors()
    return {
        labels: ['<100ms', '100-300ms', '300-600ms', '>600ms'],
        datasets: [{
            label: 'Latency',
            data: [
                props.stats.models.filter(m => m.avg_latency !== null && m.avg_latency < 100).length,
                props.stats.models.filter(m => m.avg_latency !== null && m.avg_latency >= 100 && m.avg_latency < 300).length,
                props.stats.models.filter(m => m.avg_latency !== null && m.avg_latency >= 300 && m.avg_latency < 600).length,
                props.stats.models.filter(m => m.avg_latency !== null && m.avg_latency >= 600).length,
            ],
            backgroundColor: colors.latency
        }]
    }
})

const topModels = computed(() => {
    if (!props.stats || !props.stats.models) return []
    return props.stats.models
        .slice()
        .filter(m => m.avg_latency !== null && m.avg_latency !== undefined)
        .sort((a, b) => a.avg_latency - b.avg_latency)
        .slice(0, 8)
        .map(m => ({ name: m.model_name, latency: Math.round(m.avg_latency) }))
})
</script>
