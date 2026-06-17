<template>
  <div class="space-y-6 pb-12">
        <!-- Info Box -->
    <div class="bg-red-500/5 border-4 border-red-500 rounded-xl p-4 flex gap-4 items-center">
        <div class="text-2xl">⚠️</div>
        <p class="text-[15px] text-red-500 leading-snug">
            <strong>WARNING:</strong> This page is under construction. The metrics displayed may not be accurate.
        </p>
    </div>
    <!-- Refactored Header & Summary (First View) -->
    <header class="bg-white border-2 border-black rounded-[1.5rem] p-6 shadow-premium-sm space-y-6">
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-black text-black tracking-tighter uppercase">Quota Dashboard</h1>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Usage vs. Verified Capacity</p>
            </div>
            <div class="flex gap-2 text-[10px] font-black uppercase tracking-widest">
                <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">{{ rateLimitedCount }} Throttled</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left: KPIs and Health -->
            <div class="lg:col-span-1 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 rounded-xl border border-black/5">
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requests (Used/Total)</div>
                        <div class="text-xl font-black text-black">
                            {{ formatNumber(totalUsedRequests) }} <span class="text-xs opacity-50">/ {{ formatNumber(totalCapacityRequests) }}</span>
                        </div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border border-black/5">
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tokens (Used/Total)</div>
                        <div class="text-xl font-black text-black">
                            {{ formatNumber(totalUsedTokens) }} <span class="text-xs opacity-50">/ {{ formatNumber(totalCapacityTokens) }}</span>
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-slate-50 rounded-xl border border-black/5 flex items-center justify-between">
                    <div>
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Capacity</div>
                        <div class="text-xl font-black text-black">
                            {{ 
                                (totalUsedRequests / Math.max(1, totalCapacityRequests)) > 0 && (totalUsedRequests / Math.max(1, totalCapacityRequests)) < 0.01 
                                ? '<1% Used' 
                                : Math.round((totalUsedRequests / Math.max(1, totalCapacityRequests)) * 100) + '% Used' 
                            }}
                        </div>
                        <div class="text-[9px] font-bold text-emerald-600 mt-1">
                            Reset: {{ nextResetTime ? formatCountdown(nextResetTime) : 'Stable' }}
                        </div>
                    </div>
                    <!-- Circular Gauge -->
                    <div class="relative w-12 h-12">
                        <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path class="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3" />
                            <path class="text-indigo-500" 
                                  :stroke-dasharray="Math.max(2, Math.round((totalUsedRequests / Math.max(1, totalCapacityRequests)) * 100)) + ', 100'" 
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  stroke-width="3" 
                                  stroke-linecap="round" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Right: Analytical Chart & Filters -->
            <div class="lg:col-span-2 p-4 bg-slate-50 rounded-2xl border border-black/5 space-y-4">
                <div class="flex justify-between items-center gap-4">
                    <div class="flex gap-2">
                        <select v-model="chartFilters.interval" class="bg-white border border-black/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase">
                            <option value="minute">1H</option>
                            <option value="hour">24H</option>
                            <option value="day">7D</option>
                            <option value="month">Monthly</option>
                        </select>
                        <select v-model="chartFilters.metric" class="bg-white border border-black/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase">
                            <option value="requests">Requests</option>
                            <option value="tokens">Tokens</option>
                            <option value="latency">Latency</option>
                        </select>
                    </div>
                    <div class="flex gap-2 text-[10px] font-black uppercase tracking-widest">
                        <div class="p-2 bg-white rounded-lg border border-black/5">
                            <span class="text-slate-400">Vel:</span> +{{ usageVelocity }} req/min
                        </div>
                        <div class="p-2 bg-white rounded-lg border border-black/5">
                            <span class="text-slate-400">Reset:</span> {{ nextResetTime ? formatCountdown(nextResetTime) : 'Stable' }}
                        </div>
                    </div>
                </div>

                <!-- Usage Density Heatmap (Requests) -->
                <div class="w-full h-3 bg-slate-200 rounded-full flex overflow-hidden">
                    <div v-for="p in providers" :key="p.id" 
                         class="h-full"
                         :style="{ 
                             width: (((p.usage?.requestsToday || 0) / Math.max(1, totalCapacityRequests)) * 100) + '%',
                             backgroundColor: (p.usage?.requestsToday / Math.max(1, p.rpm || 1)) > 0.7 ? '#ef4444' : '#10b981'
                         }">
                    </div>
                </div>

                <div class="h-40">
                    <Line :key="chartKey" :data="chartData" :options="chartOptions" />
                </div>
            </div>

        </div>
    </header>

    <!-- Info Box -->
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-center">
        <div class="text-2xl">💡</div>
        <p class="text-[11px] text-slate-500 leading-snug">
            <strong>Live:</strong> Metrics extracted from provider response headers. 
            <strong>Static Config:</strong> No live headers found; falling back to theoretical limits defined in configuration.
        </p>
    </div>

    <!-- Provider Table -->
    <div class="overflow-x-auto border-2 border-black rounded-[1.5rem] bg-white shadow-premium-sm">
      <table class="w-full text-left border-collapse min-w-[900px] table-fixed">
        <thead>
          <tr class="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left border-b border-black/5">
            <th class="p-4 border-r border-white/10">Provider / Model</th>
            <th class="p-4 border-r border-white/10">Status</th>
            <th class="p-4 border-r border-white/10">Request Quota</th>
            <th class="p-4 border-r border-white/10"></th>
            <th class="p-4 border-r border-white/10">Token Quota</th>
            <th class="p-4 border-r border-white/10">Reset Timer</th>
          </tr>
        </thead>
        <tbody v-for="p in allProviders" :key="p.id" class="border-b-2 border-black last:border-b-0">
          <!-- Provider Header Row -->
          <tr class="bg-slate-50">
            <td class="p-3 border-r border-black/5">
              <div class="flex items-center gap-3">
                <span class="font-black uppercase text-xs tracking-tight">{{ p.name }}</span>
              </div>
            </td>
            <td class="p-4 border-r border-black/5">&nbsp;</td>
          </tr>
          <!-- Model Sub-Rows -->
          <tr v-for="model in (p.models || []).concat(p.imageModels || [])" :key="model" 
            class="border-t border-black/5 hover:bg-indigo-50/30 transition-colors relative group">
            
            <td class="p-4 pl-8 border-r border-black/5 truncate">
              <div class="font-mono text-[11px] font-black tracking-tight text-slate-700 truncate">{{ model }}</div>
            </td>

            <td class="p-4 border-r border-black/5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="p.modelStatuses?.[model]?.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                  {{ p.modelStatuses?.[model]?.status || 'unknown' }}
                </span>
                <span v-if="p.liveRateLimits?.[model] && isRateLimited(p.liveRateLimits[model])" class="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase animate-pulse shrink-0">
                  Throttled
                </span>
              </div>
            </td>

            <!-- Limits Content -->
            <td colspan="3" class="p-4 border-r border-black/5">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Requests Section -->
                    <div class="space-y-1.5 overflow-hidden">
                        <div class="flex justify-between items-center text-[10px] font-mono">
                            <span class="font-black">Requests (RPM)</span>
                            <span class="font-black truncate ml-2">
                                {{ 
                                    (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) 
                                    ? (((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.requestsLimit || 0) - ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.requestsRemaining || 0))
                                    : (p.usage?.requestsToday || 0)
                                }}
                                <span class="opacity-20 mx-0.5">/</span>
                                {{ (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.requestsLimit ?? p.rpm }}
                            </span>
                        </div>
                        <div class="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 p-[1px]">
                            <div class="h-full block rounded-full transition-all duration-500" 
                                :class="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) ? 'bg-emerald-500' : 'bg-slate-400'"
                                :style="{ 
                                    width: (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) 
                                        ? (((((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsLimit || 0) - ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsRemaining || 0)) / Math.max(1, ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsLimit || 1))) * 100) + '%' 
                                        : (((p.usage?.requestsToday || 0) / Math.max(1, (p.rpm || 1))) * 100) + '%' 
                                }"></div>
                        </div>
                    </div>

                    <!-- Tokens Section -->
                    <div class="space-y-1.5 overflow-hidden">
                        <div class="flex justify-between items-center text-[10px] font-mono text-[var(--text-color)]">
                            <span class="font-black opacity-80">Tokens (Daily)</span>
                            <span class="font-black truncate ml-2">
                                {{ formatNumber((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) 
                                    ? (((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.tokensLimit || 0) - ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.tokensRemaining || 0))
                                    : 0) }}
                                <span class="opacity-20 mx-0.5">/</span>
                                {{ formatNumber((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.tokensLimit) ?? formatNumber(p.daily_token_limit) }}
                            </span>
                        </div>
                        <div class="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 p-[1px]">
                            <div class="h-full block rounded-full transition-all duration-500" 
                                :class="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) ? 'bar-fill' : 'bg-slate-200'"
                                :style="{ 
                                    width: (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) 
                                        ? (((((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensLimit || 0) - ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensRemaining || 0)) / Math.max(1, ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensLimit || 1))) * 100) + '%' 
                                        : (((0) / Math.max(1, (p.daily_token_limit || 1))) * 100) + '%' 
                                }"></div>
                        </div>
                    </div>
                </div>
            </td>

            <td class="p-4">
                <div v-if="p.isLive && (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])" class="flex flex-col gap-1">
                    <span class="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center gap-1 w-fit mb-1 shadow-sm">
                        <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        LIVE
                    </span>
                    <div v-if="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsReset" class="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1.5 truncate">
                      Req Reset: {{ formatCountdown((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsReset) }}
                    </div>
                    <div v-if="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensReset" class="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1.5 truncate">
                      Tok Reset: {{ formatCountdown((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensReset) }}
                    </div>
                </div>
                <div v-else class="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg border border-slate-200 w-fit flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    STATIC
                </div>
            </td>
          </tr>
        </tbody>
      </table>
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

const providers = ref([])
const socket = ref(null)
const now = ref(Date.now())

// Analytical state
const chartFilters = ref({
    interval: 'hour',
    metric: 'requests',
    providerId: '',
    modelName: ''
})
const timeSeriesData = ref([])
const themeStore = useThemeStore()
const chartKey = ref(0)

const fetchData = async () => {
    try {
        const [statusRes, timeSeriesRes] = await Promise.all([
            axios.get('/api/status'),
            axios.get('/api/usage/timeseries', { params: chartFilters.value })
        ])
        providers.value = statusRes.data.providers
        timeSeriesData.value = timeSeriesRes.data
    } catch (e) {
        console.error('Failed to fetch quota data:', e)
    }
}

// Add helper for velocity
const usageVelocity = computed(() => {
    // Calculate requests per minute from the last hour of chart data
    const lastHour = timeSeriesData.value.filter(d => d.label.includes('last hour'));
    if (lastHour.length < 2) return 0;
    const first = lastHour[0].value;
    const last = lastHour[lastHour.length - 1].value;
    return Math.max(0, last - first);
})

const nextResetTime = computed(() => {
    // Only consider providers with high usage (>50%) or near limit as bottlenecks
    let earliest = Infinity;
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsReset && limit.requestsRemaining < (limit.requestsLimit * 0.5)) {
                    if (limit.requestsReset < earliest) earliest = limit.requestsReset;
                }
            });
        }
    });
    return earliest === Infinity ? null : earliest;
})
// ... keep existing helpers (formatNumber, formatCountdown, isRateLimited) ...

// Watchers for analytics
watch(chartFilters, () => {
    fetchTimeSeries()
}, { deep: true })

const fetchTimeSeries = async () => {
    try {
        const res = await axios.get('/api/usage/timeseries', { params: chartFilters.value })
        timeSeriesData.value = res.data
    } catch (e) {
        console.error('Failed to fetch time series:', e)
    }
}

// Chart computed properties
const chartData = computed(() => {
    const isDark = themeStore.isDark
    const labels = timeSeriesData.value.map(d => {
        if (chartFilters.value.interval === 'hour') return d.label.split(' ')[1]
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
            bodyFont: { size: 10 },
            titleFont: { size: 10 }
        }
    },
    scales: {
        y: { 
            beginAtZero: true, 
            grid: { display: false },
            ticks: { font: { size: 9 } } 
        },
        x: { 
            grid: { display: false },
            ticks: { font: { size: 9 } } 
        }
    }
}))

// Watch theme change and force chart re-render
watch(() => themeStore.isDark, async () => {
    chartKey.value++
    await nextTick()
})

const allProviders = computed(() => {
    return [...providers.value].sort((a, b) => {
        // First check if one is an image provider
        const aIsImage = a.type === 'image' || (a.imageModels && a.imageModels.length > 0 && (!a.models || a.models.length === 0));
        const bIsImage = b.type === 'image' || (b.imageModels && b.imageModels.length > 0 && (!b.models || b.models.length === 0));

        if (aIsImage && !bIsImage) return 1;
        if (!aIsImage && bIsImage) return -1;
        
        // If same category, sort by priority
        return a.priority - b.priority;
    });
})

const totalUsedRequests = computed(() => {
    let total = 0
    providers.value.forEach(p => {
        // 1. Add usage from live tracking if available
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsLimit !== null) {
                    total += (limit.requestsLimit - (limit.requestsRemaining || 0))
                }
            })
        }
        // 2. Add static usage (if not already tracked by live tracking)
        // If a provider has liveRateLimits, assume its usage is covered there
        if (!p.liveRateLimits || Object.keys(p.liveRateLimits).length === 0) {
            total += (p.usage?.requestsToday || 0)
        }
    })
    return total
})

const totalUsedTokens = computed(() => {
    let total = 0
    providers.value.forEach(p => {
        // 1. Add usage from live tracking
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.tokensLimit !== null) {
                    total += (limit.tokensLimit - (limit.tokensRemaining || 0))
                }
            })
        }
        // 2. If no live tokens, we might not have static token usage tracked in the same way.
        // Assuming static tokens are harder to track without live headers for now.
    })
    return total
})

const totalCapacityRequests = computed(() => {
    let total = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits && Object.keys(p.liveRateLimits).length > 0) {
             Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsLimit) total += limit.requestsLimit
             })
        } else {
             // Fallback to static rpm for total capacity calculation if no live data
             total += (p.rpm || 0)
        }
    })
    return total
})

const totalCapacityTokens = computed(() => {
    let total = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits && Object.keys(p.liveRateLimits).length > 0) {
             Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.tokensLimit) total += limit.tokensLimit
             })
        } else {
             // Fallback to static daily_token_limit
             total += (p.daily_token_limit || 0)
        }
    })
    return total
})

const totalLiveTokenCapacity = computed(() => {
    let total = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.tokensLimit) total += limit.tokensLimit
            })
        }
    })
    return total
})

const liveTrackingCount = computed(() => {
    let count = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits) count += Object.keys(p.liveRateLimits).length
    })
    return count
})

const rateLimitedCount = computed(() => {
    let count = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (isRateLimited(limit)) count++
            })
        }
    })
    return count
})

const globalRequestPercentage = computed(() => {
    let totalRem = 0
    let totalLim = 0
    
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsLimit) {
                    totalRem += limit.requestsRemaining
                    totalLim += limit.requestsLimit
                }
            })
        }
    })
    
    if (totalLim === 0) return 100 // Or 0? Let's say 100 if no limits known
    return (totalRem / totalLim) * 100
})

const summaryGrid = computed(() => [
    { label: 'Active Providers', value: providers.value.length },
    { label: 'Live Models Tracked', value: liveTrackingCount.value },
    { label: 'Avg Health', value: Math.round(globalRequestPercentage.value) + '%' },
    { label: 'Active Alerts', value: rateLimitedCount.value }
])

const isRateLimited = (limit) => {
    if (limit.requestsRemaining === 0 && limit.requestsReset && now.value < limit.requestsReset) return true
    if (limit.tokensRemaining === 0 && limit.tokensReset && now.value < limit.tokensReset) return true
    return false
}

// ... script section helper ...

const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num
}

const formatCountdown = (resetTs) => {
    const diff = resetTs - now.value
    if (diff <= 0) return '0s'
    
    const s = Math.floor(diff / 1000) % 60
    const m = Math.floor(diff / 60000) % 60
    const h = Math.floor(diff / 3600000)
    
    let str = ''
    if (h > 0) str += `${h}h `
    if (m > 0 || h > 0) str += `${m}m `
    str += `${s}s`
    return str
}

let timer
onMounted(() => {
    fetchData()
    socket.value = io()
    socket.value.on('status_update', (data) => {
        providers.value = data
    })
    
    timer = setInterval(() => {
        now.value = Date.now()
    }, 1000)
})

onUnmounted(() => {
    if (socket.value) socket.value.disconnect()
    clearInterval(timer)
})
</script>

<style scoped>
.shadow-premium-sm {
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
}
.shadow-premium-xs {
  box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
}
</style>
