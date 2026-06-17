<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col gap-6">
    <!-- Comparison Metrics Table -->
    <div v-if="comparisonData.A || comparisonData.B" class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
            <th class="p-4 border-b border-slate-800">Metric</th>
            <th class="p-4 border-b border-slate-800 w-1/2">Model A ({{ comparisonData.A?.model || '?' }})</th>
            <th class="p-4 border-b border-slate-800 w-1/2">Model B ({{ comparisonData.B?.model || '?' }})</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr class="border-b border-slate-800/50">
            <td class="p-4 font-bold text-slate-500">Provider</td>
            <td class="p-4 text-indigo-400 font-mono">{{ comparisonData.A?.provider || '-' }}</td>
            <td class="p-4 text-emerald-400 font-mono">{{ comparisonData.B?.provider || '-' }}</td>
          </tr>
          <tr class="border-b border-slate-800/50">
            <td class="p-4 font-bold text-slate-500">Latency</td>
            <td class="p-4" :class="getWinnerClass('responseTime', 'A')">
              {{ comparisonData.A?.responseTime ? (comparisonData.A.responseTime / 1000).toFixed(2) + 's' : '-' }}
            </td>
            <td class="p-4" :class="getWinnerClass('responseTime', 'B')">
              {{ comparisonData.B?.responseTime ? (comparisonData.B.responseTime / 1000).toFixed(2) + 's' : '-' }}
            </td>
          </tr>
          <tr class="border-b border-slate-800/50">
            <td class="p-4 font-bold text-slate-500">Tokens</td>
            <td class="p-4 text-white font-mono">
              <div v-if="comparisonData.A?.inputTokens !== undefined" class="text-xs">
                In: {{ comparisonData.A.inputTokens }} / Out: {{ comparisonData.A.outputTokens }}
              </div>
              <div v-else>{{ comparisonData.A?.tokens || '-' }}</div>
            </td>
            <td class="p-4 text-white font-mono">
              <div v-if="comparisonData.B?.inputTokens !== undefined" class="text-xs">
                In: {{ comparisonData.B.inputTokens }} / Out: {{ comparisonData.B.outputTokens }}
              </div>
              <div v-else>{{ comparisonData.B?.tokens || '-' }}</div>
            </td>
          </tr>
          <tr class="border-b border-slate-800/50">
            <td class="p-4 font-bold text-slate-500">Speed</td>
            <td class="p-4" :class="getWinnerClass('speed', 'A')">
              {{ getSpeed(comparisonData.A) }} t/s
            </td>
            <td class="p-4" :class="getWinnerClass('speed', 'B')">
              {{ getSpeed(comparisonData.B) }} t/s
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Response Content Comparison -->
    <div class="flex gap-6 flex-1 min-h-0">
      <div v-for="pane in ['A', 'B']" :key="pane" class="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center gap-2">
            <h2 class="font-bold text-white flex items-center gap-2 whitespace-nowrap">
              <span class="w-2 h-2 rounded-full" :class="pane === 'A' ? 'bg-indigo-500' : 'bg-emerald-500'"></span>
              Output {{ pane }}
            </h2>
            <div class="flex gap-2 min-w-0">
              <v-select v-model="selectedProviders[pane]" :options="providers.map(p => ({label: p.name, code: p.id, status: p.status}))" label="label" :reduce="option => option.code" placeholder="Provider" class="w-48 bg-white flex-1" :append-to-body="true">
                <template #option="{ label, status }">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getStatusColor(status)"></span>
                    {{ label }}
                  </div>
                </template>
                <template #selected-option="{ label, status }">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <span class="w-2 h-2 rounded-full shrink-0" :class="getStatusColor(status)"></span>
                    <span class="truncate">{{ label }}</span>
                  </div>
                </template>
              </v-select>
              <v-select v-model="selectedModels[pane]" :options="availableModels[pane]" label="label" :reduce="option => option.code" placeholder="Model" class="w-48 bg-white flex-1" :append-to-body="true">
                <template #option="{ label, status }">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getStatusColor(status)"></span>
                    {{ label }}
                  </div>
                </template>
                <template #selected-option="{ label, status }">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <span class="w-2 h-2 rounded-full shrink-0" :class="getStatusColor(status)"></span>
                    <span class="truncate">{{ label }}</span>
                  </div>
                </template>
              </v-select>
            </div>
        </div>
        <div class="flex-1 p-6 text-slate-300 font-mono text-sm overflow-y-auto">
          <div v-if="comparisonData[pane]?.content" v-html="renderMarkdown(comparisonData[pane].content)" class="markdown-content"></div>
          <div v-else-if="loading" class="flex items-center justify-center h-full text-slate-500 animate-pulse">
            Processing model {{ pane }}...
          </div>
          <div v-else class="text-slate-600 italic">
            Awaiting comparison execution...
          </div>
        </div>
      </div>
    </div>

    <!-- Control Area -->
    <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex gap-4">
      <textarea v-model="prompt" class="flex-1 bg-slate-950/50 p-4 rounded-xl outline-none border border-slate-700 text-white resize-none" placeholder="Enter prompt to compare..." rows="3"></textarea>
      <button @click="compare" :disabled="loading" class="px-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-all disabled:opacity-50">
        {{ loading ? 'ANALYZING...' : 'RUN COMPARISON' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import io from 'socket.io-client'
import { marked } from 'marked'

const prompt = ref('')
const selectedProviders = ref({ A: '', B: '' })
const selectedModels = ref({ A: '', B: '' })
const availableModels = ref({ A: [], B: [] })
const comparisonData = ref({ A: null, B: null })
const loading = ref(false)
const providers = ref([])

const socket = io()
socket.on('status_update', (data) => { 
  providers.value = data 
  updateModels('A')
  updateModels('B')
})

const getStatusColor = (status) => {
  switch (status) {
    case 'online': return 'bg-emerald-500'
    case 'offline': return 'bg-red-500'
    case 'rate_limited': return 'bg-amber-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-slate-400'
  }
}

const updateModels = (pane) => {
  const p = providers.value.find(p => p.id === selectedProviders.value[pane])
  if (p) {
    availableModels.value[pane] = (p.models || []).map(m => {
        const mStatus = p.modelStatuses?.[m] || { status: 'unknown' }
        return { label: m, code: m, status: mStatus.status }
    })
  } else {
    availableModels.value[pane] = []
  }
}

watch(() => selectedProviders.value.A, () => {
    selectedModels.value.A = ''
    updateModels('A')
})

watch(() => selectedProviders.value.B, () => {
    selectedModels.value.B = ''
    updateModels('B')
})

const renderMarkdown = (content) => {
  return marked.parse(content || '', { breaks: true, gfm: true })
}

const getSpeed = (data) => {
  if (!data?.responseTime || !data?.tokens) return '0.00'
  return (data.tokens / (data.responseTime / 1000)).toFixed(2)
}

const getWinnerClass = (metric, pane) => {
  const otherPane = pane === 'A' ? 'B' : 'A'
  const valSelf = comparisonData.value[pane]?.[metric]
  const valOther = comparisonData.value[otherPane]?.[metric]

  if (!valSelf || !valOther) return 'text-white'

  if (metric === 'responseTime') {
    return valSelf < valOther ? 'text-emerald-400 font-bold' : 'text-slate-400'
  }
  
  if (metric === 'speed') {
    const speedSelf = parseFloat(getSpeed(comparisonData.value[pane]))
    const speedOther = parseFloat(getSpeed(comparisonData.value[otherPane]))
    return speedSelf > speedOther ? 'text-emerald-400 font-bold' : 'text-slate-400'
  }

  return 'text-white'
}

const compare = async () => {
  if (!prompt.value || loading.value) return
  loading.value = true
  comparisonData.value = { A: null, B: null }
  
  const runRequest = async (pane) => {
    const model = selectedModels.value[pane]
    const providerId = selectedProviders.value[pane]
    try {
        const res = await axios.post('/api/ai', { 
            prompt: prompt.value, 
            model: model || undefined,
            providerId: providerId || undefined
        })
        return res.data
    } catch (e) { 
        return { content: 'Error: ' + e.message, provider: 'Error', model: model || 'N/A', responseTime: 0, tokens: 0, inputTokens: 0, outputTokens: 0 } 
    }
  }

  const [resA, resB] = await Promise.all([
    runRequest('A'), 
    runRequest('B')
  ])
  
  comparisonData.value = { A: resA, B: resB }
  loading.value = false
}
</script>

<style scoped>
:deep(.markdown-content) {
  line-height: 1.6;
}
:deep(p) {
  margin-bottom: 1rem;
}
:deep(p:last-child) {
  margin-bottom: 0;
}
:deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
}
:deep(pre) {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
:deep(pre code) {
  background-color: transparent;
  padding: 0;
}
:deep(ul), :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}
:deep(ul) {
  list-style-type: disc;
}
:deep(ol) {
  list-style-type: decimal;
}
:deep(h1), :deep(h2), :deep(h3) {
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: white;
}
:deep(h1) { font-size: 1.5rem; }
:deep(h2) { font-size: 1.25rem; }
:deep(h3) { font-size: 1.125rem; }
</style>
