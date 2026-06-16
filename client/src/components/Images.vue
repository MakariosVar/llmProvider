<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <!-- Header Section -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-black text-white mb-2 tracking-tighter">IMAGINATION ENGINE</h1>
        <p class="text-slate-400">Transform your ideas into stunning visual assets using high-performance image models.</p>
      </div>
      <div class="flex gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Provider</label>
          <v-select v-model="selectedProvider" :options="imageProviders.map(p => ({label: p.name, code: p.id, status: p.status}))" label="label" :reduce="option => option.code" placeholder="Select Provider" class="w-48 bg-white rounded-xl shadow-lg" :append-to-body="true">
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
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Model</label>
          <v-select v-model="selectedModel" :options="availableModels" label="label" :reduce="option => option.code" placeholder="Select Model" class="w-48 bg-white rounded-xl shadow-lg" :append-to-body="true">
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
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col gap-8">
      <!-- Input Area -->
      <div class="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex gap-6 items-start">
        <div class="flex-1">
          <textarea v-model="prompt" @keydown.enter.exact.prevent="generate" class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-600 focus:border-indigo-500 outline-none h-24 resize-none transition-all text-lg font-medium" placeholder="Describe the image you want to create..."></textarea>
        </div>
        <button @click="generate" :disabled="loading || !prompt" class="h-24 px-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 min-w-[200px] shadow-indigo-500/20 shadow-lg group">
          <span v-if="loading" class="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
          <template v-else>
            <span class="group-hover:scale-110 transition-transform">GENERATE</span>
            <span class="text-[10px] opacity-60 tracking-[0.2em]">ENTER</span>
          </template>
        </button>
      </div>

      <!-- Output / Gallery -->
      <div class="flex-1 flex gap-8 min-h-0">
        <!-- Current Generation -->
        <div class="flex-[2] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center min-h-[500px] group shadow-inner">
          <template v-if="currentImage">
            <img :src="currentImage" class="max-w-full max-h-full object-contain cursor-zoom-in" @click="openModal(currentImage)" />
            <div class="absolute bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 flex justify-between items-center">
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Model</span>
                <span class="text-sm font-bold text-white">{{ lastUsedModel || 'Unknown' }}</span>
              </div>
              <div class="flex gap-2">
                <button @click="downloadImage(currentImage)" class="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          </template>
          <div v-else-if="loading" class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <span class="text-indigo-400 font-bold tracking-widest text-sm animate-pulse">RENDER IN PROGRESS...</span>
          </div>
          <div v-else class="flex flex-col items-center gap-6 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-slate-500 font-medium italic">Enter a prompt and hit generate to see the magic.</p>
          </div>
        </div>

        <!-- History Sidebar -->
        <div class="flex-1 flex flex-col gap-4 max-w-[300px]">
          <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest px-2">History</h3>
          <div class="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <div v-for="(img, idx) in history" :key="idx" @click="currentImage = img" class="aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all hover:scale-[1.02] active:scale-95 group relative">
              <img :src="img" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span class="text-[10px] font-black text-white tracking-widest">VIEW</span>
              </div>
            </div>
            <div v-if="history.length === 0" class="h-32 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl opacity-20">
                <span class="text-xs font-bold text-slate-500 italic">No history yet</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8" @click="isModalOpen = false">
      <img :src="modalImage" class="max-w-full max-h-full rounded-2xl shadow-2xl shadow-black" />
      <button class="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import io from 'socket.io-client'

const prompt = ref('')
const selectedProvider = ref('')
const selectedModel = ref('')
const providers = ref([])
const loading = ref(false)
const currentImage = ref(null)
const lastUsedModel = ref('')
const history = ref([])
const isModalOpen = ref(false)
const modalImage = ref('')

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

const imageProviders = computed(() => {
  return providers.value.filter(p => p.type === 'image' || (p.imageModels && p.imageModels.length > 0))
})

const availableModels = computed(() => {
  const p = providers.value.find(p => p.id === selectedProvider.value)
  if (!p) return []
  
  const models = p.imageModels || (p.type === 'image' ? p.models : [])
  return (models || []).map(m => {
    const mStatus = p.modelStatuses?.[m] || { status: 'unknown' }
    return { label: m, code: m, status: mStatus.status }
  })
})

const generate = async () => {
  if (!prompt.value || loading.value) return
  
  loading.value = true
  const targetModel = selectedModel.value
  
  try {
    const res = await axios.post('/api/ai/image', {
      prompt: prompt.value,
      providerId: selectedProvider.value || undefined,
      model: targetModel || undefined
    })
    
    const imageUrl = res.data.imageUrl
    if (currentImage.value) history.value.unshift(currentImage.value)
    currentImage.value = imageUrl
    lastUsedModel.value = res.data.model || targetModel
    
  } catch (err) {
    alert('Failed to generate image: ' + (err.response?.data?.error || err.message))
  } finally {
    loading.value = false
  }
}

const openModal = (url) => {
    modalImage.value = url
    isModalOpen.value = true
}

const downloadImage = (url) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

watch(selectedProvider, () => {
  selectedModel.value = ''
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>
