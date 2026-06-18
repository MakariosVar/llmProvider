<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-3xl p-8 backdrop-blur-xl">
      <h1 class="text-3xl font-black text-[var(--text-color)] mb-2 tracking-tighter">QUOTA & RATE LIMITS</h1>
      <p class="text-[var(--text-color)] opacity-70">Live rate limit data extracted from provider response headers. Only updates after actual requests.</p>
    </div>

    <!-- Summary Stats Row 1: Infrastructure -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Active Providers</span>
        <span class="text-3xl font-black text-[var(--text-color)]">{{ providers.length }}</span>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Total Models</span>
        <span class="text-3xl font-black text-[var(--text-color)]">{{ totalModelCount }}</span>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Models Online</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--text-color)]">{{ onlineModelCount }}</span>
          <span class="text-xs font-bold text-[var(--text-color)] opacity-40">/ {{ totalModelCount }}</span>
        </div>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Live Tracked</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--text-color)]">{{ liveModelCount }}</span>
          <span class="text-xs font-bold text-[var(--text-color)] opacity-40">models</span>
        </div>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Throttled</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--text-color)]">{{ rateLimitedCount }}</span>
          <span v-if="rateLimitedCount > 0" class="text-xs font-bold opacity-60 text-rose-500">⚠</span>
          <span v-else class="text-xs font-bold text-emerald-500">✓</span>
        </div>
      </div>

      <!-- Row 2: Live Capacity (with top accent border) -->
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2 border-t-[3px] border-t-[var(--accent-bg)]">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Configured RPM</span>
        <span class="text-3xl font-black text-[var(--text-color)]">{{ formatNumber(totalConfiguredRpm) }}</span>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2 border-t-[3px] border-t-[var(--accent-bg)]">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Live RPM Remaining</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--text-color)]">{{ formatNumber(aggregateLive.rpmRemaining) }}</span>
          <span class="text-xs font-bold text-[var(--text-color)] opacity-40">/ {{ formatNumber(aggregateLive.rpmLimit) }}</span>
        </div>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2 border-t-[3px] border-t-[var(--accent-bg)]">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Live TPM Remaining</span>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[var(--text-color)]">{{ formatNumber(aggregateLive.tpmRemaining) }}</span>
          <span class="text-xs font-bold text-[var(--text-color)] opacity-40">/ {{ formatNumber(aggregateLive.tpmLimit) }}</span>
        </div>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2 border-t-[3px] border-t-[var(--accent-bg)]">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Most Constrained</span>
        <div class="truncate">
          <span v-if="mostConstrained" class="text-lg font-black text-[var(--text-color)] truncate block">{{ mostConstrained.percent }}%</span>
          <span v-if="mostConstrained" class="text-[9px] font-bold text-[var(--text-color)] opacity-40 truncate block">{{ mostConstrained.name }}</span>
          <span v-else class="text-lg font-black text-[var(--text-color)] opacity-30">—</span>
        </div>
      </div>
      <div class="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl flex flex-col gap-2 border-t-[3px] border-t-[var(--accent-bg)]">
        <span class="text-[10px] font-black text-[var(--text-color)] opacity-50 uppercase tracking-[0.2em]">Next Reset</span>
        <span class="text-3xl font-black text-[var(--text-color)]">{{ nextReset }}</span>
      </div>
    </div>

    <!-- Provider Table -->
    <div class="overflow-x-auto border border-[var(--border-color)] rounded-2xl bg-[var(--bg-color)] shadow-xl">
      <table class="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr class="bg-[var(--accent-bg)] text-[var(--accent-text)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border-color)]">
            <th class="p-4">Provider / Model</th>
            <th class="p-4">Status</th>
            <th class="p-4">Request Quota</th>
            <th class="p-4">Token Quota</th>
            <th class="p-4">Reset</th>
          </tr>
        </thead>
        <tbody v-for="p in allProviders" :key="p.id" class="border-b border-[var(--border-color)] last:border-b-0">
          <!-- Provider Header Row -->
          <tr class="bg-[var(--bg-color)]">
            <td class="p-3 border-r border-[var(--border-color)]/20" colspan="5">
              <div class="flex items-center gap-3">
                <span class="font-black uppercase text-xs tracking-tight text-[var(--text-color)]">{{ p.name }}</span>
                <span v-if="p.isLive" class="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border border-[var(--border-color)]/30 text-[var(--text-color)] opacity-50">
                  Headers Supported
                </span>
              </div>
            </td>
          </tr>
          <!-- Model Sub-Rows -->
          <tr v-for="model in (p.models || []).concat(p.imageModels || [])" :key="model" 
            class="border-t border-[var(--border-color)]/20 hover:bg-[var(--accent-bg)]/10 transition-colors">
            
            <!-- Model Name -->
            <td class="p-4 pl-8 border-r border-[var(--border-color)]/10 truncate">
              <div class="font-mono text-[11px] font-black tracking-tight text-[var(--text-color)] opacity-80 truncate">{{ model }}</div>
            </td>

            <!-- Status -->
            <td class="p-4 border-r border-[var(--border-color)]/10">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" :class="getStatusColor(p.modelStatuses?.[model]?.status)"></span>
                <span class="text-[9px] font-black text-[var(--text-color)] opacity-60 uppercase tracking-widest truncate">
                  {{ p.modelStatuses?.[model]?.status || 'unknown' }}
                </span>
                <span v-if="getLiveData(p, model) && isRateLimited(getLiveData(p, model))" 
                      class="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase animate-pulse shrink-0">
                  Throttled
                </span>
              </div>
            </td>

            <!-- Request Quota -->
            <td class="p-4 border-r border-[var(--border-color)]/10">
              <div v-if="getLiveData(p, model)" class="space-y-1.5">
                <div class="flex justify-between items-center text-[10px] font-mono text-[var(--text-color)]">
                  <span class="font-black opacity-60">RPM</span>
                  <span class="font-black">
                    {{ getUsed(getLiveData(p, model), 'requests') }}
                    <span class="opacity-20 mx-0.5">/</span>
                    {{ getLiveData(p, model).requestsLimit ?? '—' }}
                  </span>
                </div>
                <div class="h-2 w-full bg-[var(--border-color)]/10 rounded-full overflow-hidden border border-[var(--border-color)]/10 p-[1px]">
                  <div class="h-full block rounded-full transition-all duration-500 bg-[var(--accent-bg)]"
                       :style="{ width: getPercent(getLiveData(p, model), 'requests') + '%' }"></div>
                </div>
              </div>
              <div v-else class="text-[10px] font-bold text-[var(--text-color)] opacity-30 uppercase tracking-wider">
                No live data
              </div>
            </td>

            <!-- Token Quota -->
            <td class="p-4 border-r border-[var(--border-color)]/10">
              <div v-if="getLiveData(p, model) && getLiveData(p, model).tokensLimit" class="space-y-1.5">
                <div class="flex justify-between items-center text-[10px] font-mono text-[var(--text-color)]">
                  <span class="font-black opacity-60">TPM</span>
                  <span class="font-black">
                    {{ formatNumber(getUsed(getLiveData(p, model), 'tokens')) }}
                    <span class="opacity-20 mx-0.5">/</span>
                    {{ formatNumber(getLiveData(p, model).tokensLimit) }}
                  </span>
                </div>
                <div class="h-2 w-full bg-[var(--border-color)]/10 rounded-full overflow-hidden border border-[var(--border-color)]/10 p-[1px]">
                  <div class="h-full block rounded-full transition-all duration-500 bg-[var(--accent-bg)]"
                       :style="{ width: getPercent(getLiveData(p, model), 'tokens') + '%' }"></div>
                </div>
              </div>
              <div v-else class="text-[10px] font-bold text-[var(--text-color)] opacity-30 uppercase tracking-wider">
                {{ getLiveData(p, model) ? 'Not tracked' : 'No live data' }}
              </div>
            </td>

            <!-- Reset Timer -->
            <td class="p-4">
              <div v-if="getLiveData(p, model)" class="flex flex-col gap-1">
                <span class="px-2 py-0.5 bg-[var(--accent-bg)] text-[var(--accent-text)] text-[9px] font-black rounded-full flex items-center gap-1 w-fit shadow-sm">
                  <span class="w-1.5 h-1.5 bg-[var(--accent-text)] rounded-full animate-pulse opacity-60"></span>
                  LIVE
                </span>
                <div v-if="getLiveData(p, model).requestsReset" class="text-[9px] font-black text-[var(--text-color)] opacity-60 uppercase truncate">
                  Req: {{ formatCountdown(getLiveData(p, model).requestsReset) }}
                </div>
                <div v-if="getLiveData(p, model).tokensReset" class="text-[9px] font-black text-[var(--text-color)] opacity-60 uppercase truncate">
                  Tok: {{ formatCountdown(getLiveData(p, model).tokensReset) }}
                </div>
                <div v-if="getLiveData(p, model).lastUpdated" class="text-[8px] text-[var(--text-color)] opacity-30 font-mono">
                  {{ getAge(getLiveData(p, model).lastUpdated) }}
                </div>
              </div>
              <div v-else class="px-2 py-1 bg-[var(--border-color)]/10 text-[var(--text-color)] opacity-40 text-[9px] font-bold rounded-lg border border-[var(--border-color)]/20 w-fit flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-[var(--text-color)] opacity-30 rounded-full"></span>
                STATIC
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Box -->
    <div class="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-xl p-4 flex gap-4 items-start">
      <div class="text-lg opacity-60">ℹ️</div>
      <p class="text-[11px] text-[var(--text-color)] opacity-50 leading-snug">
        <strong>LIVE</strong> metrics are extracted from provider response headers after each request. 
        They show the current rate limit window (typically per-minute), not cumulative usage.
        <strong>STATIC</strong> means no headers are available for that model — it uses configured limits only.
        Data freshness is shown under each LIVE badge.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'

const providers = ref([])
const socket = ref(null)
const now = ref(Date.now())

const allProviders = computed(() => {
    return [...providers.value].sort((a, b) => {
        const aIsImage = a.type === 'image' || (a.imageModels && a.imageModels.length > 0 && (!a.models || a.models.length === 0));
        const bIsImage = b.type === 'image' || (b.imageModels && b.imageModels.length > 0 && (!b.models || b.models.length === 0));
        if (aIsImage && !bIsImage) return 1;
        if (!aIsImage && bIsImage) return -1;
        return a.priority - b.priority;
    });
})

const totalModelCount = computed(() => {
    let count = 0
    providers.value.forEach(p => {
        count += (p.models || []).length + (p.imageModels || []).length
    })
    return count
})

const onlineModelCount = computed(() => {
    let count = 0
    providers.value.forEach(p => {
        if (p.modelStatuses) {
            Object.values(p.modelStatuses).forEach(s => {
                if (s.status === 'online') count++
            })
        }
    })
    return count
})

const liveModelCount = computed(() => {
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

const totalConfiguredRpm = computed(() => {
    return providers.value.reduce((sum, p) => sum + (p.rpm || 0), 0)
})

const aggregateLive = computed(() => {
    let rpmLimit = 0, rpmRemaining = 0, tpmLimit = 0, tpmRemaining = 0
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsLimit !== null && limit.requestsLimit !== undefined) {
                    rpmLimit += limit.requestsLimit
                    rpmRemaining += (limit.requestsRemaining || 0)
                }
                if (limit.tokensLimit !== null && limit.tokensLimit !== undefined) {
                    tpmLimit += limit.tokensLimit
                    tpmRemaining += (limit.tokensRemaining || 0)
                }
            })
        }
    })
    return { rpmLimit, rpmRemaining, tpmLimit, tpmRemaining }
})

const mostConstrained = computed(() => {
    let worst = null
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.entries(p.liveRateLimits).forEach(([model, limit]) => {
                if (limit.requestsLimit && limit.requestsLimit > 0) {
                    const used = ((limit.requestsLimit - (limit.requestsRemaining || 0)) / limit.requestsLimit) * 100
                    if (!worst || used > worst.percent) {
                        worst = { name: model, percent: Math.round(used) }
                    }
                }
            })
        }
    })
    return worst
})

const nextReset = computed(() => {
    let earliest = Infinity
    providers.value.forEach(p => {
        if (p.liveRateLimits) {
            Object.values(p.liveRateLimits).forEach(limit => {
                if (limit.requestsReset && limit.requestsReset > now.value && limit.requestsReset < earliest) {
                    earliest = limit.requestsReset
                }
                if (limit.tokensReset && limit.tokensReset > now.value && limit.tokensReset < earliest) {
                    earliest = limit.tokensReset
                }
            })
        }
    })
    return earliest === Infinity ? '—' : formatCountdown(earliest)
})

// Get live rate limit data for a specific model (no providerWide fallback — it's dead code)
const getLiveData = (provider, model) => {
    return provider.liveRateLimits?.[model] || null
}

// Calculate used = limit - remaining
const getUsed = (liveData, type) => {
    if (!liveData) return 0
    const limit = type === 'requests' ? liveData.requestsLimit : liveData.tokensLimit
    const remaining = type === 'requests' ? liveData.requestsRemaining : liveData.tokensRemaining
    if (limit === null || limit === undefined) return 0
    return Math.max(0, (limit || 0) - (remaining || 0))
}

// Calculate percentage for progress bars
const getPercent = (liveData, type) => {
    if (!liveData) return 0
    const limit = type === 'requests' ? liveData.requestsLimit : liveData.tokensLimit
    if (!limit) return 0
    const used = getUsed(liveData, type)
    return Math.min(100, Math.round((used / limit) * 100))
}

const getStatusColor = (status) => {
    if (status === 'online') return 'bg-emerald-500'
    if (status === 'error' || status === 'offline') return 'bg-rose-500'
    return 'bg-[var(--text-color)] opacity-30'
}

const isRateLimited = (limit) => {
    if (limit.requestsRemaining === 0 && limit.requestsReset && now.value < limit.requestsReset) return true
    if (limit.tokensRemaining === 0 && limit.tokensReset && now.value < limit.tokensReset) return true
    return false
}

const formatNumber = (num) => {
    if (!num && num !== 0) return '—'
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toLocaleString()
}

const formatCountdown = (resetTs) => {
    const diff = resetTs - now.value
    if (diff <= 0) return 'now'
    
    const s = Math.floor(diff / 1000) % 60
    const m = Math.floor(diff / 60000) % 60
    const h = Math.floor(diff / 3600000)
    
    let str = ''
    if (h > 0) str += `${h}h `
    if (m > 0 || h > 0) str += `${m}m `
    str += `${s}s`
    return str
}

const getAge = (timestamp) => {
    const diff = now.value - timestamp
    if (diff < 60000) return 'Updated < 1m ago'
    if (diff < 3600000) return `Updated ${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `Updated ${Math.floor(diff / 3600000)}h ago`
    return `Updated ${Math.floor(diff / 86400000)}d ago`
}

const fetchData = async () => {
    try {
        const res = await axios.get('/api/status')
        providers.value = res.data.providers
    } catch (e) {
        console.error('Failed to fetch quota data:', e)
    }
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
