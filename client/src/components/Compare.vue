<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col gap-6">
    <div class="flex gap-6 flex-1">
      <div v-for="pane in ['A', 'B']" :key="pane" class="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <h2 class="font-bold text-white">Model {{ pane }} Output</h2>
            <v-select v-model="selectedModels[pane]" :options="allModels" placeholder="Model" class="w-32 bg-white" :append-to-body="true"></v-select>
        </div>
        <div class="flex-1 p-6 text-slate-300 font-mono text-sm overflow-y-auto whitespace-pre-wrap">
          <div v-html="renderMarkdown(responses[pane])"></div>
        </div>
      </div>
    </div>
    <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex gap-4">
      <textarea v-model="prompt" class="flex-1 bg-slate-950/50 p-4 rounded-xl outline-none border border-slate-700 text-white resize-none" placeholder="Enter prompt to compare..." rows="3"></textarea>
      <button @click="compare" :disabled="loading" class="px-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-all disabled:opacity-50">
        {{ loading ? 'Comparing...' : 'Run Comparison' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import io from 'socket.io-client'
import { marked } from 'marked'

const prompt = ref('')
const selectedModels = ref({ A: '', B: '' })
const responses = ref({ A: '', B: '' })
const loading = ref(false)
const providers = ref([])

const socket = io()
socket.on('status_update', (data) => { providers.value = data })

const allModels = computed(() => {
    return [...new Set(providers.value.flatMap(p => p.models || []))]
})

const renderMarkdown = (content) => {
  if (!content || content === 'Awaiting prompt execution...') return content || 'Awaiting prompt execution...'
  return marked.parse(content, { breaks: true, gfm: true })
}

const compare = async () => {
  if (!prompt.value || loading.value) return
  loading.value = true
  responses.value = { A: 'Processing...', B: 'Processing...' }
  
  const runRequest = async (model) => {
    try {
        const res = await axios.post('/api/ai', { prompt: prompt.value, model: model || undefined })
        return res.data.content
    } catch (e) { return 'Error: ' + e.message }
  }

  const [resA, resB] = await Promise.all([runRequest(selectedModels.value.A), runRequest(selectedModels.value.B)])
  responses.value = { A: resA, B: resB }
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
