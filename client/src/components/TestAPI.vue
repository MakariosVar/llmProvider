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
              <v-select v-model="selectedType" :options="['text', 'stream', 'openai', 'image']" placeholder="Select Type" class="bg-white rounded-lg" :append-to-body="true"></v-select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Provider (Optional)</label>
              <v-select v-model="selectedProvider" :options="filteredProviders.map(p => ({label: p.name, code: p.id, status: p.status}))" label="label" :reduce="option => option.code" placeholder="Select Provider" class="bg-white rounded-lg" :append-to-body="true">
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

            <!-- Advanced Parameters -->
            <div>
              <button @click="showAdvanced = !showAdvanced" class="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors w-full text-left">
                <span class="transition-transform" :class="showAdvanced ? 'rotate-90' : ''">▶</span>
                Advanced Parameters
              </button>
              <div v-if="showAdvanced" class="mt-4 space-y-4 pl-2 border-l-2 border-slate-800">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Temperature ({{ temperature }})</label>
                  <input type="range" v-model.number="temperature" min="0" max="2" step="0.1" class="w-full accent-indigo-500" />
                  <div class="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>Precise (0)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Max Tokens</label>
                  <input type="number" v-model="maxTokens" placeholder="No limit" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-2">System Prompt</label>
                  <textarea v-model="systemPrompt" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none h-20 resize-none transition-colors" placeholder="Optional system-level instruction..."></textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Messages JSON (Advanced)</label>
                  <textarea v-model="messagesJson" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none h-20 resize-none transition-colors font-mono text-xs" placeholder='[{&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;Hello&quot;}]'></textarea>
                </div>
              </div>
            </div>

            <button
              @click="runTest"
              :disabled="isRunning"
              class="w-full py-3 cursor-pointer
                    border border-[var(--color-accent)]
                    text-[var(--color-accent)]
                    hover:bg-[var(--color-bg)]/80
                    hover:text-[var(--text-color)]/80
                    rounded-xl font-bold
                    transition-all
                    disabled:opacity-50
                    flex items-center justify-center gap-2"
            >
              <span v-if="isRunning" class="w-4 h-4 rounded-full animate-spin"></span>
              {{ isRunning ? 'EXECUTING...' : 'RUN LIVE TEST' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Code & Documentation Panel -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Result Window -->
        <div v-if="liveResult || liveImageUrl || responseMetadata" class="bg-black border-2 border-indigo-500/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div class="bg-indigo-900/20 border-b border-indigo-500/30 p-3 flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-300 uppercase tracking-widest">Live API Response</span>
            <div class="flex gap-2">
              <button v-if="rawResponse" @click="showRaw = !showRaw" class="text-indigo-400 hover:text-white text-xs">{{ showRaw ? 'RENDER' : 'RAW' }}</button>
              <button v-if="liveResult" @click="copyResult" class="text-indigo-400 hover:text-white text-xs">{{ resultCopied ? 'COPIED!' : 'Copy' }}</button>
              <button @click="clearResult" class="text-indigo-400 hover:text-white text-xs">Clear</button>
            </div>
          </div>

          <div v-if="responseMetadata" class="bg-slate-950 px-6 py-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs border-b border-slate-800">
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span class="font-semibold">{{ responseMetadata.provider }}</span>
              <span class="text-slate-600">/</span>
              <span>{{ responseMetadata.model }}</span>
            </span>
            <span v-if="responseMetadata.responseTime !== undefined" class="text-slate-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ (responseMetadata.responseTime / 1000).toFixed(2) }}s
            </span>
            <span v-if="responseMetadata.inputTokens !== undefined" class="text-slate-400">
              In: <span class="text-indigo-400 font-semibold">{{ responseMetadata.inputTokens }}</span>
            </span>
            <span v-if="responseMetadata.outputTokens !== undefined" class="text-slate-400">
              Out: <span class="text-emerald-400 font-semibold">{{ responseMetadata.outputTokens }}</span>
            </span>
            <span v-if="responseMetadata.tokens !== undefined" class="text-slate-500">
              ∑ {{ responseMetadata.tokens }} tokens
            </span>
          </div>

          <div class="overflow-y-auto max-h-[400px] flex flex-col">
            <template v-if="showRaw && rawResponse">
              <pre class="p-6 text-xs text-emerald-400 font-mono whitespace-pre-wrap">{{ rawResponse }}</pre>
            </template>
            <template v-else-if="liveImageUrl">
              <div class="p-6 flex flex-col items-center gap-4">
                <img :src="liveImageUrl" class="max-w-full rounded-lg shadow-lg border border-slate-800" />
                <div class="flex gap-2">
                  <button @click="copyResult" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">{{ resultCopied ? 'COPIED!' : 'Copy URL' }}</button>
                  <a :href="liveImageUrl" target="_blank" class="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">Open</a>
                </div>
              </div>
            </template>
            <template v-else-if="liveResult">
              <div v-if="selectedType === 'stream'" class="p-6 font-mono text-sm text-emerald-400 whitespace-pre-wrap">
                {{ liveResult }}<span v-if="isRunning" class="animate-pulse text-indigo-400">▌</span>
              </div>
              <div v-else class="p-6 text-sm text-slate-200 prose prose-invert prose-sm max-w-none" v-html="renderedResult"></div>
            </template>
          </div>

          <div v-if="responseStatus" class="bg-slate-950 border-t border-slate-800 px-6 py-1.5 text-xs text-slate-500 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full" :class="responseStatus < 400 ? 'bg-emerald-500' : 'bg-red-500'"></span>
            HTTP {{ responseStatus }}
          </div>
        </div>

        <!-- Response History -->
        <div v-if="responseHistory.length > 0">
          <div class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <button @click="showHistory = !showHistory" class="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors">
              <span>Test History ({{ responseHistory.length }})</span>
              <span class="transition-transform" :class="showHistory ? 'rotate-180' : ''">▼</span>
            </button>
            <div v-if="showHistory" class="border-t border-slate-800 max-h-60 overflow-y-auto">
              <div v-for="(entry, i) in responseHistory" :key="i"
                   @click="restoreHistory(entry)"
                   class="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/30 transition-colors last:border-b-0 text-xs">
                <span class="text-indigo-400 font-bold uppercase shrink-0 w-14">{{ entry.type }}</span>
                <span class="text-slate-400 shrink-0">{{ entry.provider || '—' }}<span v-if="entry.model"> / {{ entry.model }}</span></span>
                <span class="text-slate-600 truncate flex-1">{{ entry.prompt }}</span>
                <span class="text-slate-600 shrink-0">{{ entry.timestamp }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Snippets -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div class="tab-bar p-2 flex gap-2 flex-wrap">
            <button v-for="lang in languages" :key="lang.id"
              @click="activeLang = lang.id"
              class="tab-btn px-4 py-2 rounded-lg text-sm font-bold cursor-pointer"
              :class="activeLang === lang.id ? 'tab-btn--active' : 'tab-btn--inactive'">
              {{ lang.name }}
            </button>
          </div>
          <div class="p-6 relative group min-h-[200px] snippet-bg">
            <pre class="text-indigo-400 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">{{ generatedCode }}</pre>
            <button @click="copyCode" class="absolute top-4 right-4 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs">
              {{ copied ? 'COPIED!' : 'COPY CODE' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import io from 'socket.io-client'
import { marked } from 'marked'

const selectedType = ref('text')
const selectedProvider = ref('')
const selectedModel = ref('')
const testPrompt = ref('What is the capital of France? (answer in max 10 words)')
const providers = ref([])
const activeLang = ref('curl')
const copied = ref(false)
const resultCopied = ref(false)
const liveResult = ref('')
const liveImageUrl = ref('')
const isRunning = ref(false)
const showAdvanced = ref(false)
const temperature = ref(1.0)
const maxTokens = ref(null)
const systemPrompt = ref('')
const messagesJson = ref('')
const responseMetadata = ref(null)
const responseStatus = ref(null)
const showHistory = ref(true)
const responseHistory = ref([])
const rawResponse = ref('')
const showRaw = ref(false)

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

const languages = [
  { id: 'curl', name: 'cURL' },
  { id: 'js', name: 'JavaScript (Fetch)' },
  { id: 'py', name: 'Python (Requests)' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' }
]

const filteredProviders = computed(() => {
  if (selectedType.value === 'image') {
    return providers.value.filter(p => p.type === 'image' || (p.imageModels && p.imageModels.length > 0))
  }
  return providers.value.filter(p => p.type !== 'image')
})

const availableModelsList = computed(() => {
  const p = providers.value.find(p => p.id === selectedProvider.value)
  if (!p) return []

  const models = selectedType.value === 'image'
    ? (p.imageModels || (p.type === 'image' ? p.models : []))
    : (p.models || [])

  return (models || []).map(m => {
    const mStatus = p.modelStatuses?.[m] || { status: 'unknown' }
    return { label: m, code: m, status: mStatus.status }
  })
})

const renderedResult = computed(() => {
  if (!liveResult.value || selectedType.value === 'stream') return ''
  return marked.parse(liveResult.value, { breaks: true, gfm: true })
})

const buildPayload = () => {
  if (selectedType.value === 'openai') {
    const messages = []
    if (systemPrompt.value.trim()) messages.push({ role: 'system', content: systemPrompt.value.trim() })
    if (messagesJson.value.trim()) {
      try {
        const parsed = JSON.parse(messagesJson.value.trim())
        if (Array.isArray(parsed)) messages.push(...parsed)
      } catch (e) {}
    }
    messages.push({ role: 'user', content: testPrompt.value })
    const payload = { messages, stream: false }
    if (selectedModel.value) payload.model = selectedModel.value
    if (temperature.value !== 1.0) payload.temperature = temperature.value
    if (maxTokens.value) payload.max_tokens = Number(maxTokens.value)
    return payload
  }
  const payload = { prompt: testPrompt.value }
  if (selectedProvider.value) payload.providerId = selectedProvider.value
  if (selectedModel.value) payload.model = selectedModel.value
  if (temperature.value !== 1.0) payload.temperature = temperature.value
  if (maxTokens.value) payload.max_tokens = Number(maxTokens.value)
  if (systemPrompt.value.trim()) payload.systemPrompt = systemPrompt.value.trim()
  if (messagesJson.value.trim()) {
    try {
      payload.messages = JSON.parse(messagesJson.value.trim())
    } catch (e) {}
  }
  return payload
}

const generatedCode = computed(() => {
  const url = window.location.origin
  const path = selectedType.value === 'stream' ? '/api/ai/stream' : (selectedType.value === 'openai' ? '/v1/chat/completions' : (selectedType.value === 'image' ? '/api/ai/image' : '/api/ai'))

  const payload = buildPayload()
  const payloadStr = JSON.stringify(payload, null, 2)

  const authHeader = '# -H "Authorization: Bearer YOUR_API_KEY"'
  const authHeaderGo = '// req.Header.Set("Authorization", "Bearer YOUR_API_KEY")'
  const authHeaderRust = '// .header("Authorization", "Bearer YOUR_API_KEY")'

  if (activeLang.value === 'curl') {
    return `curl -X POST ${url}${path} \\
  -H "Content-Type: application/json" \\
  ${authHeader} \\
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
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers, stream=True)
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
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
  }

  if (activeLang.value === 'go') {
    if (selectedType.value === 'stream') {
      return `package main

import (
  "bufio"
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
  "strings"
)

func main() {
  url := "${url}${path}"
  payload := ${JSON.stringify(payload, null, 2)}
  body, _ := json.Marshal(payload)

  req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
  req.Header.Set("Content-Type", "application/json")
  ${authHeaderGo.slice(2)}

  resp, _ := http.DefaultClient.Do(req)
  defer resp.Body.Close()

  scanner := bufio.NewScanner(resp.Body)
  for scanner.Scan() {
    line := scanner.Text()
    if strings.HasPrefix(line, "data:") {
      var data map[string]interface{}
      json.Unmarshal([]byte(line[5:]), &data)
      if token, ok := data["token"]; ok {
        fmt.Print(token)
      }
    }
  }
}`
    }
    return `package main

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
)

func main() {
  url := "${url}${path}"
  payload := ${JSON.stringify(payload, null, 2)}
  body, _ := json.Marshal(payload)

  req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
  req.Header.Set("Content-Type", "application/json")
  ${authHeaderGo.slice(2)}

  resp, _ := http.DefaultClient.Do(req)
  defer resp.Body.Close()

  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  fmt.Println(result["content"])
}`
  }

  if (activeLang.value === 'rust') {
    if (selectedType.value === 'stream') {
      return `use reqwest;
use futures_util::StreamExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
  let client = reqwest::Client::new();
  let payload = serde_json::json!(${payloadStr});

  let resp = client
    .post("${url}${path}")
    .json(&payload)
    ${authHeaderRust}
    .send()
    .await?;

  let mut stream = resp.bytes_stream();
  let mut buffer = String::new();
  while let Some(chunk) = stream.next().await {
    let chunk = chunk?;
    buffer.push_str(&String::from_utf8_lossy(&chunk));
    for line in buffer.lines() {
      if line.starts_with("data:") {
        if let Ok(data) = serde_json::from_str::<serde_json::Value>(&line[5..]) {
          if let Some(token) = data.get("token").and_then(|t| t.as_str()) {
            print!("{}", token);
          }
        }
      }
    }
  }
  Ok(())
}`
    }
    return `use reqwest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
  let client = reqwest::Client::new();
  let payload = serde_json::json!(${payloadStr});

  let resp = client
    .post("${url}${path}")
    .json(&payload)
    ${authHeaderRust}
    .send()
    .await?;

  let data: serde_json::Value = resp.json().await?;
  println!("{}", data["content"]);
  Ok(())
}`
  }

  return ''
})

const clearResult = () => {
  liveResult.value = ''
  liveImageUrl.value = ''
  responseMetadata.value = null
  responseStatus.value = null
  rawResponse.value = ''
  showRaw.value = false
}

const addToHistory = (entry) => {
  responseHistory.value.unshift({
    type: selectedType.value,
    provider: entry.provider || responseMetadata.value?.provider,
    model: entry.model || responseMetadata.value?.model,
    prompt: testPrompt.value,
    content: liveResult.value,
    imageUrl: liveImageUrl.value,
    metadata: responseMetadata.value,
    timestamp: new Date().toLocaleTimeString()
  })
  if (responseHistory.value.length > 20) {
    responseHistory.value = responseHistory.value.slice(0, 20)
  }
}

const restoreHistory = (entry) => {
  liveResult.value = entry.content
  liveImageUrl.value = entry.imageUrl || ''
  responseMetadata.value = entry.metadata
  responseStatus.value = null
}

const runTest = async () => {
  if (isRunning.value) return
  isRunning.value = true
  clearResult()

  const path = selectedType.value === 'stream' ? '/api/ai/stream' : (selectedType.value === 'openai' ? '/v1/chat/completions' : (selectedType.value === 'image' ? '/api/ai/image' : '/api/ai'))
  const payload = buildPayload()

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    responseStatus.value = response.status

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
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
              if (data.provider) {
                responseMetadata.value = { ...(responseMetadata.value || {}), provider: data.provider, model: data.model }
              }
              if (data.content) {
                liveResult.value = data.content
                responseMetadata.value = { ...(responseMetadata.value || {}), responseTime: data.responseTime, tokens: data.tokens, inputTokens: data.inputTokens, outputTokens: data.outputTokens }
              }
            } catch (e) {}
          }
        }
      }
      rawResponse.value = liveResult.value
    } else {
      const data = await response.json()
      rawResponse.value = JSON.stringify(data, null, 2)
      if (selectedType.value === 'image') {
        liveImageUrl.value = data.imageUrl
        responseMetadata.value = { provider: data.provider, model: data.model }
      } else if (selectedType.value === 'openai') {
        responseMetadata.value = {
          provider: data.model,
          model: data.model,
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          tokens: data.usage?.total_tokens
        }
        liveResult.value = data.choices?.[0]?.message?.content || JSON.stringify(data)
      } else {
        responseMetadata.value = {
          provider: data.provider,
          model: data.model,
          responseTime: data.responseTime,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          tokens: data.tokens
        }
        liveResult.value = data.content
      }
    }

    addToHistory({ provider: responseMetadata.value?.provider, model: responseMetadata.value?.model })
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

const copyResult = () => {
  const text = showRaw.value ? rawResponse.value : (liveImageUrl.value || liveResult.value)
  if (text) {
    navigator.clipboard.writeText(text)
    resultCopied.value = true
    setTimeout(() => resultCopied.value = false, 2000)
  }
}

watch(selectedType, () => {
  selectedProvider.value = ''
  selectedModel.value = ''
  if (selectedType.value === 'image') {
    testPrompt.value = 'A futuristic cybernetic city, high detail, 8k'
  } else if (selectedType.value === 'openai') {
    testPrompt.value = 'What is the capital of France?'
  } else {
    testPrompt.value = 'What is the capital of France? (answer in max 10 words)'
  }
})

watch(selectedProvider, () => {
  selectedModel.value = ''
})
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tab-bar {
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  transition: all 0.15s ease;
}

.tab-btn--active {
  background-color: var(--accent-bg) !important;
  color: var(--accent-text) !important;
}

.tab-btn--inactive {
  color: var(--text-color) !important;
  opacity: 0.4;
}

.tab-btn--inactive:hover {
  opacity: 0.7;
}

.snippet-bg {
  background: var(--bg-color);
}
</style>
