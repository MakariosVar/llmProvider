<template>
  <div class="space-y-6 pb-12">
    <!-- Header & Summary -->
    <header class="space-y-4">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 class="text-3xl font-black text-[var(--text-color)] tracking-tighter uppercase leading-none">
            Quota Dashboard
          </h1>
          <p class="text-slate-400 mt-1 text-sm font-medium">Verified infrastructure capacity.</p>
        </div>
        
        <div class="flex flex-wrap gap-3">
          <div class="px-4 py-2 border-2 border-black rounded-xl shadow-premium-xs flex flex-col gap-0.5 min-w-[120px] bg-indigo-500/10 border-indigo-500/20">
            <span class="text-[9px] font-black uppercase tracking-widest opacity-80 text-indigo-400">Verified RPM</span>
            <div class="value text-xl font-black text-black tracking-tight">{{ totalLiveRpmCapacity.toLocaleString() }}</div>
          </div>
          <div class="px-4 py-2 border-2 border-black rounded-xl shadow-premium-xs flex flex-col gap-0.5 min-w-[120px] bg-emerald-500/10 border-emerald-500/20">
            <span class="text-[9px] font-black uppercase tracking-widest opacity-80 text-emerald-400">Verified TPM</span>
            <div class="value text-xl font-black text-black tracking-tight">{{ formatNumber(totalLiveTokenCapacity) }}</div>
          </div>
          <div class="px-4 py-2 border-2 border-black rounded-xl shadow-premium-xs flex flex-col gap-0.5 min-w-[120px] bg-rose-500/10 border-rose-500/20">
            <span class="text-[9px] font-black uppercase tracking-widest opacity-80 text-rose-400">Active Blocks</span>
            <div class="value text-xl font-black text-black tracking-tight">{{ rateLimitedCount }}</div>
          </div>
        </div>
      </div>

      <!-- Global Capacity Visualization -->
      <div class="bg-black/5 border-2 border-black rounded-[1.5rem] p-5 shadow-premium-sm">
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                Verified System Health
            </h2>
            <div class="text-[10px] font-mono font-bold">{{ Math.round(globalRequestPercentage) }}% Verified Capacity</div>
        </div>
        <div class="h-4 bg-black/10 rounded-full overflow-hidden border-2 border-black p-0.5">
            <div class="h-full rounded-full transition-all duration-1000 ease-out"
                :class="globalRequestPercentage > 50 ? 'bg-indigo-500' : globalRequestPercentage > 20 ? 'bg-amber-500' : 'bg-rose-500'"
                :style="{ width: globalRequestPercentage + '%' }">
            </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div v-for="stat in summaryGrid" :key="stat.label" class="p-3 bg-white/50 rounded-xl border border-black/5">
                <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{{ stat.label }}</div>
                <div class="text-sm font-bold">{{ stat.value }}</div>
            </div>
        </div>
      </div>
    </header>

    <!-- Info Box -->
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-center">
        <div class="text-2xl">💡</div>
        <p class="text-[11px] text-slate-500 leading-snug">
            Showing only **Verified Live Metrics**. Models without live headers (Gemini, Ollama, etc.) are hidden from this view.
        </p>
    </div>

    <!-- Provider Table -->
    <div class="overflow-x-auto border-2 border-black rounded-[1.5rem] bg-white shadow-premium-sm">
      <table class="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr class="bg-black text-white text-[10px] font-black uppercase tracking-widest">
            <th class="p-4 border-r border-white/10">Provider / Model</th>
            <th class="p-4 border-r border-white/10">Status</th>
            <th class="p-4 border-r border-white/10 w-64">Request Quota</th>
            <th class="p-4 border-r border-white/10 w-64">Token Quota</th>
            <th class="p-4">Reset Timer</th>
          </tr>
        </thead>
        <tbody v-for="p in allProviders" :key="p.id" class="border-b-2 border-black last:border-b-0">
          <!-- Provider Header Row -->
          <tr class="bg-slate-50">
            <td colspan="5" class="p-3">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-black text-white rounded flex items-center justify-center font-black text-[9px] uppercase shadow-premium-xs">
                  {{ p.id.substring(0,2) }}
                </div>
                <span class="font-black uppercase text-xs tracking-tight">{{ p.name }}</span>
                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-black/5 rounded">P:{{ p.priority }}</span>
              </div>
            </td>
          </tr>
          <!-- Model Sub-Rows -->
          <tr v-for="model in (p.models || []).concat(p.imageModels || [])" :key="model" 
            class="border-t border-black/5 hover:bg-indigo-50/30 transition-colors relative group">
            
            <td class="p-4 pl-8 border-r border-black/5">
              <div class="font-mono text-[11px] font-black tracking-tight text-slate-700">{{ model }}</div>
            </td>

            <td class="p-4 border-r border-black/5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="p.modelStatuses?.[model]?.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {{ p.modelStatuses?.[model]?.status || 'unknown' }}
                </span>
                <span v-if="p.liveRateLimits?.[model] && isRateLimited(p.liveRateLimits[model])" class="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase animate-pulse">
                  Throttled
                </span>
              </div>
            </td>

            <!-- Limits Content -->
            <td colspan="3" class="p-4 border-r border-black/5">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Requests Section -->
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-[10px] font-mono">
                            <span class="font-black">Requests</span>
                            <span class="font-black">
                                {{ (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.requestsRemaining ?? '—' }}
                                <span class="opacity-20 mx-0.5">/</span>
                                {{ (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.requestsLimit ?? p.rpm }}
                            </span>
                        </div>
                        <div class="h-2 bg-black/5 rounded-full overflow-hidden border border-black p-[1px]">
                            <div class="h-full rounded-full transition-all duration-500" 
                                :class="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) ? getBarColor((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsRemaining / (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsLimit) : 'bg-slate-300'"
                                :style="{ width: (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) ? ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsRemaining / (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsLimit * 100) + '%' : '100%' }"></div>
                        </div>
                    </div>

                    <!-- Tokens Section -->
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-[10px] font-mono">
                            <span class="font-black">Tokens</span>
                            <span class="font-black">
                                {{ formatNumber((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.tokensRemaining) ?? '—' }}
                                <span class="opacity-20 mx-0.5">/</span>
                                {{ formatNumber((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])?.tokensLimit) ?? formatNumber(p.daily_limit) }}
                            </span>
                        </div>
                        <div class="h-2 bg-black/5 rounded-full overflow-hidden border border-black p-[1px]">
                            <div class="h-full rounded-full transition-all duration-500" 
                                :class="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) ? getBarColor((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensRemaining / (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensLimit) : 'bg-slate-300'"
                                :style="{ width: (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']) ? ((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensRemaining / (p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensLimit * 100) + '%' : '100%' }"></div>
                        </div>
                    </div>
                </div>
            </td>

            <td class="p-4">
                <div v-if="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide'])" class="flex flex-col gap-1">
                    <div v-if="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsReset" class="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1.5">
                      <span class="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></span>
                      Req: {{ formatCountdown((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).requestsReset) }}
                    </div>
                    <div v-if="(p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensReset" class="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1.5">
                      <span class="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                      Tok: {{ formatCountdown((p.liveRateLimits?.[model] || p.liveRateLimits?.['providerWide']).tokensReset) }}
                    </div>
                </div>
                <div v-else class="text-[9px] text-slate-300 uppercase italic">
                    Static
                </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const providers = ref([])
const socket = ref(null)
const now = ref(Date.now())

const fetchData = async () => {
  try {
    const res = await axios.get('/api/status')
    providers.value = res.data.providers
  } catch (e) {
    console.error('Failed to fetch quota data:', e)
  }
}

const allProviders = computed(() => {
    return [...providers.value].sort((a, b) => a.priority - b.priority)
})

const totalLiveRpmCapacity = computed(() => {
    let total = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsLimit) total += limit.requestsLimit
            })
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
    { label: 'Verified Avg Health', value: Math.round(globalRequestPercentage.value) + '%' },
    { label: 'Active Alerts', value: rateLimitedCount.value }
])

const isRateLimited = (limit) => {
    if (limit.requestsRemaining === 0 && limit.requestsReset && now.value < limit.requestsReset) return true
    if (limit.tokensRemaining === 0 && limit.tokensReset && now.value < limit.tokensReset) return true
    return false
}

const getBarColor = (percent) => {
    if (percent < 0.2) return 'bg-rose-500'
    if (percent < 0.5) return 'bg-amber-500'
    return 'bg-indigo-500'
}

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
