<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <!-- Header Section -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
      <h1 class="text-3xl font-black text-white mb-2">API Documentation & Test Builder</h1>
      <p class="text-slate-400">Integrate the LLM Provider service into your own applications with these interactive code snippets.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Builder Panel -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span class="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Request Builder
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Endpoint Type</label>
              <v-select v-model="selectedType" :options="['text', 'stream', 'image']" placeholder="Select Type" class="bg-white rounded-lg" :append-to-body="true"></v-select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Provider (Optional)</label>
              <v-select v-model="selectedProvider" :options="providers.map(p => ({label: p.name, code: p.id, status: p.status}))" label="label" :reduce="option => option.code" placeholder="Select Provider" class="bg-white rounded-lg" :append-to-body="true">
                <template #option="{ label, status }">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getStatusColor(status)"></span>
                    {{ label }}
                  </div>
                </template>
                <template #selected-option="{ label, status }">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getStatusColor(status)"></span>
                    {{ label }}
                  </div>
                </template>
              </v-select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Model (Optional)</label>
              <v-select v-model="selectedModel" :options="availableModelsList" label="label" :reduce="option => option.code" placeholder="Select Model" class="bg-white rounded-lg" :append-to-body="true">
                <template #option="{ label, status }">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getStatusColor(status)"></span>
                    {{ label }}
                  </div>
                </template>
                <template #selected-option="{ label, status }">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getStatusColor(status)"></span>
                    {{ label }}
                  </div>
                </template>
              </v-select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Prompt</label>
              <textarea v-model="testPrompt" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none h-24 resize-none transition-colors" placeholder="Enter prompt for code generation..."></textarea>
            </div>

            <button @click="runTest" :disabled="isRunning" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <span v-if="isRunning" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ isRunning ? 'EXECUTING...' : 'RUN LIVE TEST' }}
            </button>
          </div>
        </div>

        <!-- Endpoint Specs -->
        <div class="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
          <h3 class="font-bold text-indigo-300 mb-2">Endpoint URLs</h3>
          <div class="space-y-3">
            <div v-for="ep in endpoints" :key="ep.path" class="text-xs">
              <span class="bg-indigo-500 text-white px-1.5 py-0.5 rounded mr-2 font-bold">{{ ep.method }}</span>
              <code class="text-slate-300">{{ ep.path }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Code & Documentation Panel -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Result Window (Conditional) -->
        <div v-if="liveResult" class="bg-black border-2 border-indigo-500/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div class="bg-indigo-900/20 border-b border-indigo-500/30 p-3 flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-300 uppercase tracking-widest">Live API Response</span>
            <button @click="liveResult = ''" class="text-indigo-400 hover:text-white text-xs">Clear</button>
          </div>
          <div class="p-6 font-mono text-sm text-emerald-400 overflow-y-auto max-h-[300px] whitespace-pre-wrap">
            {{ liveResult }}
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
          <!-- Tab Header -->
          <div class="bg-slate-950/50 border-b border-slate-800 p-2 flex gap-2">
            <button v-for="lang in languages" :key="lang.id" 
              @click="activeLang = lang.id"
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              :class="activeLang === lang.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'">
              {{ lang.name }}
            </button>
          </div>

          <!-- Code Display -->
          <div class="flex-1 p-6 relative group bg-slate-950">
            <pre class="text-indigo-400 font-mono text-sm leading-relaxed overflow-x-auto h-full">{{ generatedCode }}</pre>
            <button @click="copyCode" class="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs">
              {{ copied ? 'COPIED!' : 'COPY CODE' }}
            </button>
          </div>
        </div>

        <!-- Documentation Card -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4">Parameter Reference</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-indigo-400 font-mono font-bold">prompt</span>
              <p class="text-slate-500 text-xs mt-1">String. The main instruction or question for the model. Required.</p>
            </div>
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-indigo-400 font-mono font-bold">providerId</span>
              <p class="text-slate-500 text-xs mt-1">String. Force a specific provider (e.g., 'google_gemini', 'groq'). Optional.</p>
            </div>
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-indigo-400 font-mono font-bold">model</span>
              <p class="text-slate-500 text-xs mt-1">String. Request a specific model name. Optional.</p>
            </div>
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-indigo-400 font-mono font-bold">messages</span>
              <p class="text-slate-500 text-xs mt-1">Array. Full conversation history for multi-turn chat. Optional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import io from 'socket.io-client'

const selectedType = ref('text')
const selectedProvider = ref('')
const selectedModel = ref('')
const testPrompt = ref('What is the capital of France?')
const providers = ref([])
const activeLang = ref('curl')
const copied = ref(false)
const liveResult = ref('')
const isRunning = ref(false)

const socket = io()
socket.on('status_update', (data) => {
  providers.value = data
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

const endpoints = [
  { method: 'POST', path: '/api/ai' },
  { method: 'POST', path: '/api/ai/stream' },
  { method: 'POST', path: '/api/ai/image' }
]

const languages = [
  { id: 'curl', name: 'cURL' },
  { id: 'js', name: 'JavaScript (Fetch)' },
  { id: 'py', name: 'Python (Requests)' }
]

const availableModelsList = computed(() => {
  const p = providers.value.find(p => p.id === selectedProvider.value)
  if (!p) return []
  return (p.models || []).map(m => {
    const mStatus = p.modelStatuses?.[m] || { status: 'unknown' }
    return { label: m, code: m, status: mStatus.status }
  })
})

const generatedCode = computed(() => {
  const url = window.location.origin
  const path = selectedType.value === 'stream' ? '/api/ai/stream' : (selectedType.value === 'image' ? '/api/ai/image' : '/api/ai')
  
  const payload = {
    prompt: testPrompt.value
  }
  if (selectedProvider.value) payload.providerId = selectedProvider.value
  if (selectedModel.value) payload.model = selectedModel.value

  const payloadStr = JSON.stringify(payload, null, 2)

  if (activeLang.value === 'curl') {
    return `curl -X POST ${url}${path} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`
  }

  if (activeLang.value === 'js') {
    if (selectedType.value === 'stream') {
      return `const response = await fetch('${url}${path}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${payloadStr})
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const data = JSON.parse(line.substring(5));
      if (data.token) console.log(data.token);
    }
  }
}`
    }
    return `const response = await fetch('${url}${path}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${payloadStr})
});

const data = await response.json();
console.log(data);`
  }

  if (activeLang.value === 'py') {
    if (selectedType.value === 'stream') {
        return `import requests
import json

url = "${url}${path}"
payload = ${JSON.stringify(payload, null, 4)}

response = requests.post(url, json=payload, stream=True)
for line in response.iter_lines():
    if line:
        decoded_line = line.decode('utf-8')
        if decoded_line.startswith('data:'):
            data = json.loads(decoded_line[5:])
            if 'token' in data:
                print(data['token'], end='', flush=True)`
    }
    return `import requests

url = "${url}${path}"
payload = ${JSON.stringify(payload, null, 4)}

response = requests.post(url, json=payload)
print(response.json())`
  }

  return ''
})

const runTest = async () => {
  if (isRunning.value) return
  isRunning.value = true
  liveResult.value = 'Connecting...'

  const path = selectedType.value === 'stream' ? '/api/ai/stream' : (selectedType.value === 'image' ? '/api/ai/image' : '/api/ai')
  const payload = {
    prompt: testPrompt.value
  }
  if (selectedProvider.value) payload.providerId = selectedProvider.value
  if (selectedModel.value) payload.model = selectedModel.value

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || `HTTP ${response.status}`)
    }

    if (selectedType.value === 'stream') {
      liveResult.value = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const data = JSON.parse(line.trim().substring(5))
              if (data.token) liveResult.value += data.token
              if (data.content) liveResult.value = data.content // Full content at end
            } catch (e) {}
          }
        }
      }
    } else {
      const data = await response.json()
      liveResult.value = JSON.stringify(data, null, 2)
    }
  } catch (err) {
    liveResult.value = `Error: ${err.message}`
  } finally {
    isRunning.value = false
  }
}

const copyCode = () => {
  navigator.clipboard.writeText(generatedCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

watch(selectedProvider, () => {
  selectedModel.value = ''
})
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
