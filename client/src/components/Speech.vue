<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <!-- Header Section -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-black text-white mb-2 tracking-tighter">SPEECH TO TEXT</h1>
        <p class="text-slate-400">Record or upload audio and transcribe it instantly with Groq Whisper.</p>
      </div>
      <div class="flex gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Model</label>
          <v-select v-model="selectedModel" :options="audioModels.map(m => ({label: m, code: m}))" label="label" :reduce="option => option.code" placeholder="Select Model" class="w-56 bg-white rounded-xl shadow-lg" :append-to-body="true"></v-select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Language</label>
          <v-select v-model="selectedLanguage" :options="languages" label="label" :reduce="option => option.code" placeholder="Auto-detect" class="w-44 bg-white rounded-xl shadow-lg" :append-to-body="true"></v-select>
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col gap-8">
      <!-- Input Area -->
      <div class="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
        <!-- Mode Tabs -->
        <div class="flex gap-2 mb-6">
          <button @click="mode = 'record'" :class="mode === 'record' ? 'bg-[var(--accent-bg)] text-[var(--accent-text)]' : 'bg-slate-950 text-slate-400 hover:text-white'" class="px-5 py-2.5 rounded-xl font-black text-sm tracking-widest transition-all">
            MICROPHONE
          </button>
          <button @click="mode = 'upload'" :class="mode === 'upload' ? 'bg-[var(--accent-bg)] text-[var(--accent-text)]' : 'bg-slate-950 text-slate-400 hover:text-white'" class="px-5 py-2.5 rounded-xl font-black text-sm tracking-widest transition-all">
            UPLOAD FILE
          </button>
        </div>

        <!-- Record Mode -->
        <div v-if="mode === 'record'" class="flex flex-col items-center gap-6 py-6">
          <button v-if="!recording" @click="startRecording" :disabled="micUnavailable || loading" class="w-40 h-40 rounded-full bg-slate-950 border-4 border-slate-700 hover:border-[var(--accent-text)] text-slate-400 hover:text-white flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed group">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8" />
            </svg>
            <span class="text-xs font-black tracking-widest">START RECORDING</span>
          </button>
          <button v-else @click="stopRecording" class="w-40 h-40 rounded-full bg-red-500/10 border-4 border-red-500 text-red-400 flex flex-col items-center justify-center gap-3 transition-all animate-pulse">
            <span class="w-10 h-10 bg-red-500 rounded-lg animate-pulse"></span>
            <span class="text-xs font-black tracking-widest">STOP</span>
          </button>
          <div v-if="recording" class="text-2xl font-black font-mono tracking-widest">{{ elapsedTime }}</div>
          <div v-if="micUnavailable" class="text-red-400 text-sm font-medium">Microphone not available. Use the upload tab instead.</div>

          <div v-if="recordedBlob" class="flex items-center gap-4 w-full max-w-xl">
            <audio :src="recordedUrl" controls class="flex-1"></audio>
            <span class="text-xs text-slate-500 font-mono">{{ formatSize(recordedBlob.size) }}</span>
          </div>
        </div>

        <!-- Upload Mode -->
        <div v-else class="flex flex-col items-center gap-6 py-6">
          <div @click="fileInput.click()" @dragover.prevent @drop.prevent="onDrop" class="w-full max-w-xl border-2 border-dashed border-slate-700 hover:border-[var(--accent-text)] rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all bg-slate-950/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-slate-400 font-medium">
              <span v-if="!selectedFile">Drag & drop an audio file here, or click to browse</span>
              <span v-else class="text-white font-bold">{{ selectedFile.name }}</span>
            </p>
            <p v-if="selectedFile" class="text-xs text-slate-500 font-mono">{{ formatSize(selectedFile.size) }} · {{ selectedFile.type || 'unknown type' }}</p>
            <p v-else class="text-xs text-slate-500">mp3, wav, m4a, ogg, webm, flac, mp4 — max 100MB</p>
            <input ref="fileInput" type="file" accept="audio/*,.mp4" class="hidden" @change="onFileChange" />
          </div>
        </div>

        <!-- Transcribe Button -->
        <div class="flex justify-center mt-6">
          <button @click="transcribe" :disabled="loading || !canTranscribe" class="px-14 py-4 bg-[var(--accent-bg)] hover:opacity-80 text-[var(--accent-text)] rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg">
            <span v-if="loading" class="w-6 h-6 border-4 border-[var(--accent-text)]/30 border-t-[var(--accent-text)] rounded-full animate-spin"></span>
            <template v-else>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{{ loading ? 'TRANSCRIBING...' : 'TRANSCRIBE' }}</span>
            </template>
          </button>
        </div>
      </div>

      <!-- Output / Transcript -->
      <div class="flex-1 flex gap-8 min-h-0">
        <!-- Current Transcript -->
        <div class="flex-[2] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative min-h-[300px] shadow-inner">
          <template v-if="transcript">
            <div class="absolute top-4 right-4 flex gap-2 z-10">
              <button @click="copyTranscript" class="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors" title="Copy">
                <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button @click="sendToChat" class="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors" title="Send to Chat">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div class="p-6 pr-20 h-full overflow-y-auto custom-scrollbar">
              <div class="flex flex-wrap gap-3 mb-4">
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">{{ lastResult.model }}</span>
                <span v-if="lastResult.language" class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">Lang: {{ lastResult.language }}</span>
                <span v-if="lastResult.duration" class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">Duration: {{ lastResult.duration.toFixed(1) }}s</span>
                <span v-if="lastResult.responseTime" class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">{{ lastResult.responseTime }}ms</span>
              </div>
              <p class="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">{{ transcript }}</p>
            </div>
          </template>
          <div v-else-if="loading" class="flex flex-col items-center justify-center h-full gap-4 py-16">
            <div class="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <span class="text-indigo-400 font-bold tracking-widest text-sm animate-pulse">TRANSCRIBING...</span>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-full gap-6 py-16 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            <p class="text-slate-500 font-medium italic">Record or upload audio and hit transcribe to see the result.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import io from 'socket.io-client'

const router = useRouter()
const socket = io()

const providers = ref([])
socket.on('status_update', (data) => {
  providers.value = data
})

const mode = ref('record')
const selectedModel = ref('')
const selectedLanguage = ref('')

const languages = [
  { label: 'Auto-detect', code: '' },
  { label: 'English', code: 'en' },
  { label: 'Greek', code: 'el' },
  { label: 'French', code: 'fr' },
  { label: 'German', code: 'de' },
  { label: 'Spanish', code: 'es' },
  { label: 'Italian', code: 'it' },
  { label: 'Portuguese', code: 'pt' },
  { label: 'Russian', code: 'ru' },
  { label: 'Turkish', code: 'tr' },
  { label: 'Arabic', code: 'ar' },
  { label: 'Chinese', code: 'zh' },
  { label: 'Japanese', code: 'ja' },
  { label: 'Korean', code: 'ko' },
  { label: 'Hindi', code: 'hi' },
]

const audioModels = computed(() => {
  const groq = providers.value.find(p => p.id === 'groq')
  return (groq?.audioModels || ['whisper-large-v3-turbo', 'whisper-large-v3'])
})

const loading = ref(false)
const transcript = ref('')
const lastResult = ref({})
const copied = ref(false)
const error = ref('')

// Recording state
const recording = ref(false)
const micUnavailable = ref(false)
const recordedBlob = ref(null)
const recordedUrl = ref('')
const elapsedSeconds = ref(0)
let mediaRecorder = null
let mediaStream = null
let chunks = []
let timerInterval = null

// Upload state
const selectedFile = ref(null)
const fileInput = ref(null)

const canTranscribe = computed(() => {
  if (mode.value === 'record') return !!recordedBlob.value
  return !!selectedFile.value
})

const elapsedTime = computed(() => {
  const m = String(Math.floor(elapsedSeconds.value / 60)).padStart(2, '0')
  const s = String(elapsedSeconds.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

const startRecording = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (e) {
    micUnavailable.value = true
    return
  }

  chunks = []
  mediaRecorder = new MediaRecorder(mediaStream)
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  mediaRecorder.onstop = () => {
    recordedBlob.value = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
    if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value)
    recordedUrl.value = URL.createObjectURL(recordedBlob.value)
    mediaStream?.getTracks().forEach(t => t.stop())
    mediaStream = null
  }

  mediaRecorder.start()
  recording.value = true
  elapsedSeconds.value = 0
  timerInterval = setInterval(() => { elapsedSeconds.value++ }, 1000)
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  recording.value = false
  clearInterval(timerInterval)
}

const onFileChange = (e) => {
  selectedFile.value = e.target.files?.[0] || null
}

const onDrop = (e) => {
  selectedFile.value = e.dataTransfer.files?.[0] || null
}

const transcribe = async () => {
  if (!canTranscribe.value || loading.value) return

  let file, filename, mimetype
  if (mode.value === 'record') {
    file = recordedBlob.value
    filename = `recording-${Date.now()}.webm`
    mimetype = recordedBlob.value.type
  } else {
    file = selectedFile.value
    filename = selectedFile.value.name
    mimetype = selectedFile.value.type
  }

  if (file.size > 100 * 1024 * 1024) {
    alert('Audio file too large (max 100MB)')
    return
  }

  loading.value = true
  error.value = ''
  transcript.value = ''

  const formData = new FormData()
  formData.append('file', file, filename)
  if (selectedModel.value) formData.append('model', selectedModel.value)
  if (selectedLanguage.value) formData.append('language', selectedLanguage.value)

  try {
    const res = await axios.post('/api/ai/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    transcript.value = res.data.text || ''
    lastResult.value = res.data
  } catch (err) {
    const msg = err.response?.data?.error || err.message
    error.value = msg
    transcript.value = msg
  } finally {
    loading.value = false
  }
}

const copyTranscript = async () => {
  if (!transcript.value) return
  try {
    await navigator.clipboard.writeText(transcript.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch (e) { /* clipboard unavailable */ }
}

const sendToChat = () => {
  router.push({ path: '/chat' })
}

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onBeforeUnmount(() => {
  stopRecording()
  if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value)
  socket.disconnect()
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
