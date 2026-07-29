<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col gap-6">
    <!-- Chat Area -->
    <div class="flex-1 flex flex-col rounded-premium shadow-premium overflow-hidden border-2 border-black">
      <div class="p-4 border-b-2 border-black flex flex-wrap justify-between items-center gap-3 bg-white">
        <h2 class="font-black text-xl flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-black"></span>
          COMMAND TERMINAL
        </h2>
        <div class="flex flex-wrap gap-2 items-center">
          <button
            @click="showHistoryModal = true"
            class="px-3 py-2 rounded-[1rem] border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
          <button
            @click="startNewChat"
            class="px-3 py-2 rounded-[1rem] border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
          <v-select v-model="selectedProvider" :options="providers.map(p => ({label: p.name, code: p.id, status: p.status}))" label="label" :reduce="option => option.code" placeholder="Select Provider" class="w-48 sm:w-64 bg-white" :append-to-body="true">
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
          <v-select v-model="selectedModel" :options="availableModels" label="label" :reduce="option => option.code" placeholder="Select Model" class="w-48 sm:w-64 bg-white" :append-to-body="true">
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
      
      <div class="flex-1 p-6 overflow-y-auto space-y-4 bg-white" ref="chatContainer">
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center opacity-30 select-none">
          <p class="font-black text-2xl uppercase">Ready for input</p>
          <p class="text-sm font-bold mt-2">Type a command below to begin</p>
        </div>
        <div v-for="msg in messages" :key="msg.id" :class="msg.role === 'user' ? 'text-right' : 'text-left'">
          <div class="inline-block p-4 rounded-[1rem] max-w-[80%] border-2 border-black font-medium" :class="msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-black'">
            <div v-if="msg.role === 'ai'" class="flex justify-between items-center text-[10px] font-bold uppercase mb-1 opacity-70 gap-4">
              <span>{{ msg.provider || '...' }} / {{ msg.model || '...' }}</span>
              <span v-if="msg.responseTime" class="bg-black/10 px-2 py-0.5 rounded">
                {{ (msg.responseTime / 1000).toFixed(2) }}s | 
                <span v-if="msg.inputTokens !== undefined">
                  In: {{ msg.inputTokens }} / Out: {{ msg.outputTokens }}
                </span>
                <span v-else>
                  {{ msg.tokens }} tokens
                </span>
              </span>
            </div>
            <div v-if="msg.role === 'ai'" v-html="renderMarkdown(msg.content)" class="markdown-content text-left"></div>
            <div v-else>{{ msg.content }}</div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t-2 border-black bg-white">
        <textarea v-model="prompt" @keydown.enter.exact.prevent="send" class="w-full p-4 rounded-[1rem] outline-none border-2 border-black text-black resize-none" placeholder="Enter prompt..." rows="3"></textarea>
        <button @click="send" :disabled="loading" class="mt-2 w-full py-3 bg-black text-white rounded-[1rem] font-bold transition-all disabled:opacity-50">
          {{ loading ? 'EXECUTING...' : 'EXECUTE COMMAND' }}
        </button>
      </div>
    </div>

    <ChatHistoryModal
      v-model:isOpen="showHistoryModal"
      :conversations="chatStore.conversations"
      :active-id="chatStore.activeConversationId"
      @select="loadConversation"
      @delete="deleteConversation"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import io from 'socket.io-client'
import { marked } from 'marked'
import { useChatStore } from '../store'
import ChatHistoryModal from './ChatHistoryModal.vue'

const chatStore = useChatStore()
const messages = ref([])
const prompt = ref('')
const selectedProvider = ref('')
const selectedModel = ref('')
const providers = ref([])
const availableModels = ref([])
const loading = ref(false)
const chatContainer = ref(null)
const showHistoryModal = ref(false)

const socket = io()
socket.on('status_update', (data) => {
  providers.value = data
  updateModels()
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

const updateModels = () => {
  const p = providers.value.find(p => p.id === selectedProvider.value)
  if (p) {
    availableModels.value = (p.models || []).map(m => {
        const mStatus = p.modelStatuses?.[m] || { status: 'unknown' }
        return { label: m, code: m, status: mStatus.status }
    })
  } else {
    availableModels.value = []
  }
}

watch(selectedProvider, () => {
    selectedModel.value = ''
    updateModels()
})

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const persistChat = () => {
  if (loading.value || !messages.value.length) return
  chatStore.saveConversation(messages.value, selectedProvider.value, selectedModel.value)
}

const restoreActiveChat = () => {
  const conv = chatStore.activeConversation
  if (!conv) return
  messages.value = JSON.parse(JSON.stringify(conv.messages))
  selectedProvider.value = conv.providerId || ''
  selectedModel.value = conv.model || ''
  updateModels()
  nextTick(scrollToBottom)
}

const startNewChat = () => {
  if (messages.value.length && !loading.value) {
    persistChat()
  }
  chatStore.clearActive()
  messages.value = []
  prompt.value = ''
}

const loadConversation = (id) => {
  const conv = chatStore.loadConversation(id)
  if (!conv) return
  messages.value = JSON.parse(JSON.stringify(conv.messages))
  selectedProvider.value = conv.providerId || ''
  selectedModel.value = conv.model || ''
  updateModels()
  showHistoryModal.value = false
  nextTick(scrollToBottom)
}

const deleteConversation = (id) => {
  const wasActive = chatStore.activeConversationId === id
  chatStore.deleteConversation(id)
  if (wasActive) {
    messages.value = []
    prompt.value = ''
  }
}

onMounted(() => {
  restoreActiveChat()
})

const renderMarkdown = (content) => {
  return marked.parse(content || '', { breaks: true, gfm: true })
}

const send = async () => {
  if (!prompt.value || loading.value) return
  
  const userPrompt = prompt.value
  const history = messages.value.map(m => ({ 
    role: m.role, 
    content: m.content 
  }))
  
  messages.value.push({ id: Date.now(), role: 'user', content: userPrompt })
  prompt.value = ''
  loading.value = true
  
  const aiMessageId = Date.now() + 1
  messages.value.push({ 
    id: aiMessageId, 
    role: 'ai', 
    content: '',
    provider: '',
    model: '',
    responseTime: null,
    tokens: 0,
    inputTokens: 0,
    outputTokens: 0
  })

  try {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        messages: history,
        providerId: selectedProvider.value || undefined,
        model: selectedModel.value || undefined
      })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      let currentEvent = '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('event:')) {
          currentEvent = trimmedLine.replace('event:', '').trim();
        } else if (trimmedLine.startsWith('data:')) {
          const dataStr = trimmedLine.replace('data:', '').trim();
          if (!dataStr || dataStr === '{}') continue;
          
          try {
            const data = JSON.parse(dataStr);
            const msgIndex = messages.value.findIndex(m => m.id === aiMessageId);
            if (msgIndex === -1) continue;

            if (currentEvent === 'start') {
              messages.value[msgIndex].provider = data.provider;
              messages.value[msgIndex].model = data.model;
            } else if (currentEvent === 'data') {
              messages.value[msgIndex].content += data.token;
            } else if (currentEvent === 'end') {
              messages.value[msgIndex].content = data.content;
              messages.value[msgIndex].responseTime = data.responseTime;
              messages.value[msgIndex].tokens = data.tokens;
              messages.value[msgIndex].inputTokens = data.inputTokens;
              messages.value[msgIndex].outputTokens = data.outputTokens;
            } else if (currentEvent === 'error') {
              messages.value[msgIndex].content = 'Error: ' + data.error;
            }
            
            nextTick(scrollToBottom);
          } catch (e) {
            console.error('Error parsing SSE data:', e, dataStr);
          }
        }
      }
    }
  } catch (err) {
    const msgIndex = messages.value.findIndex(m => m.id === aiMessageId);
    if (msgIndex !== -1) {
      messages.value[msgIndex].content = 'Error: ' + err.message;
    } else {
      messages.value.push({ id: Date.now() + 2, role: 'ai', content: 'Error: ' + err.message });
    }
  } finally {
    loading.value = false
    persistChat()
    nextTick(scrollToBottom)
  }
}
</script>

<style>
.markdown-content {
  line-height: 1.6;
}
.markdown-content p {
  margin-bottom: 1rem;
}
.markdown-content p:last-child {
  margin-bottom: 0;
}
.markdown-content code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
}
.markdown-content pre {
  background-color: #f4f4f4;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  color: black;
}
.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}
.markdown-content ul, .markdown-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}
.markdown-content ul {
  list-style-type: disc;
}
.markdown-content ol {
  list-style-type: decimal;
}
.markdown-content h1, .markdown-content h2, .markdown-content h3 {
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.markdown-content h1 { font-size: 1.5rem; }
.markdown-content h2 { font-size: 1.25rem; }
.markdown-content h3 { font-size: 1.125rem; }
</style>
