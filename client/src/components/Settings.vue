<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <!-- Header Section -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
      <h1 class="text-3xl font-black text-white mb-2">Settings</h1>
      <p class="text-slate-400">Manage and test API keys in the .env file</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Settings Card -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span class="w-2 h-6 bg-indigo-500 rounded-full"></span>
          API Keys
        </h2>
        
        <div class="space-y-6">
          <div v-for="key in settingsKeys.apiKeys" :key="key" class="group">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">{{ getKeyLabel(key) }}</label>
            <div class="relative">
              <input 
                v-model="settings[key]" 
                :type="showValues || visibleKeys[key] ? 'text' : 'password'"
                :placeholder="getPlaceholder(key)"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all group-hover:border-slate-600"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                <button 
                  @click="toggleShowValue(key)" 
                  class="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg v-if="showValues" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
                <button 
                  @click="testKey(key)" 
                  :disabled="isTesting[key]"
                  class="text-slate-400 hover:text-green-400 transition-colors ml-2"
                >
                  <svg v-if="isTesting[key]" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m6.414-4H9.816M9 16v-4.5a3.5 3.5 0 117 0V20m-7-7h7"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <polygon points="10,8 16,12 10,16" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="testResults[key]" :class="[`text-xs mt-1 ${testResults[key].success ? 'text-green-400' : 'text-red-400'}`]">
              {{ testResults[key].message }}
            </div>
          </div>
        </div>
      </div>

      <!-- System Settings Card -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span class="w-2 h-6 bg-green-500 rounded-full"></span>
          System Settings
        </h2>
        
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">PORT</label>
            <input 
              v-model="settings.PORT" 
              type="number"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">ADMIN_USERNAME</label>
            <input 
              v-model="settings.ADMIN_USERNAME" 
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">ADMIN_PASSWORD</label>
            <input 
              v-model="settings.ADMIN_PASSWORD" 
              type="password"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Ollama Card -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span class="w-2 h-6 bg-purple-500 rounded-full"></span>
          Ollama (Local)
        </h2>
        
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">OLLAMA_HOST</label>
          <input 
            v-model="settings.OLLAMA_HOST" 
            placeholder="http://localhost:11434"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <!-- Actions Card -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl lg:col-span-2 xl:col-span-3">
        <div class="flex flex-wrap gap-4">
          <button 
            @click="saveSettings"
            :disabled="saving"
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m6.414-4H9.816M9 16v-4.5a3.5 3.5 0 117 0V20m-7-7h7"/>
            </svg>
            <span>{{ saving ? 'Saving...' : 'Save All Settings' }}</span>
          </button>
          
          <button 
            @click="toggleShowValues = !toggleShowValues"
            class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <svg v-if="showValues" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            <span>Show {{ showValues ? 'Hidden' : 'Values' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import io from 'socket.io-client'

const loading = ref(true)
const saving = ref(false)
const toggleShowValues = ref(false)

const settings = reactive({})
const isTesting = reactive({})
const testResults = reactive({})
const visibleKeys = reactive({})

const showValues = computed(() => toggleShowValues.value)

const settingsKeys = {
  apiKeys: [
    'GEMINI_API_KEY',
    'GROQ_API_KEY',
    'CEREBRAS_API_KEY',
    'CLOUDFLARE_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'HF_API_KEY',
    'OPENROUTER_API_KEY',
    'MISTRAL_API_KEY',
    'COHERE_API_KEY',
    'GITHUB_TOKEN',
    'NOVITA_API_KEY'
  ]
}

const socket = io()

socket.on('status_update', () => {
  loadSettings()
})

const getKeyLabel = (key) => {
  const labels = {
    'GEMINI_API_KEY': 'Gemini API Key',
    'GROQ_API_KEY': 'Groq API Key',
    'CEREBRAS_API_KEY': 'Cerebras API Key',
    'CLOUDFLARE_TOKEN': 'Cloudflare Token',
    'CLOUDFLARE_ACCOUNT_ID': 'Cloudflare Account ID',
    'HF_API_KEY': 'HuggingFace API Key',
    'OPENROUTER_API_KEY': 'OpenRouter API Key',
    'MISTRAL_API_KEY': 'Mistral API Key',
    'COHERE_API_KEY': 'Cohere API Key',
    'GITHUB_TOKEN': 'GitHub Token',
    'NOVITA_API_KEY': 'Novita API Key'
  }
  return labels[key] || key
}

const getPlaceholder = (key) => {
  const placeholders = {
    'GEMINI_API_KEY': 'your_gemini_api_key_here',
    'GROQ_API_KEY': 'your_groq_api_key_here',
    'CEREBRAS_API_KEY': 'your_cerebras_api_key_here',
    'CLOUDFLARE_TOKEN': 'your_cloudflare_token_here',
    'CLOUDFLARE_ACCOUNT_ID': 'your_cloudflare_account_id_here',
    'HF_API_KEY': 'your_huggingface_api_key_here',
    'OPENROUTER_API_KEY': 'your_openrouter_api_key_here',
    'MISTRAL_API_KEY': 'your_mistral_api_key_here',
    'COHERE_API_KEY': 'your_cohere_api_key_here',
    'GITHUB_TOKEN': 'your_github_personal_access_token_here',
    'NOVITA_API_KEY': 'your_novita_api_key_here'
  }
  return placeholders[key] || ''
}

const authHeaders = () => {
  const token = sessionStorage.getItem('authToken')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const loadSettings = async () => {
  try {
    const response = await fetch('/api/settings', { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to load settings: ${response.status}`)
    }
    
    const data = await response.json()
    Object.keys(data).forEach(key => {
      settings[key] = data[key]
    })
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

const toggleShowValue = (key) => {
  visibleKeys[key] = !visibleKeys[key]
}

const testKey = async (key) => {
  if (isTesting[key] || !settings[key]) {
    return
  }
  
  isTesting[key] = true
  testResults[key] = null
  
  try {
    const response = await fetch(`/api/settings/test/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ value: settings[key] })
    })
    
    const data = await response.json()
    
    testResults[key] = {
      success: data.success,
      message: data.message
    }
    
    if (data.success) {
      console.log(`${key}: Test passed - ${data.message}`)
    } else {
      console.error(`${key}: Test failed - ${data.error}`)
    }
  } catch (error) {
    testResults[key] = {
      success: false,
      message: `Test error: ${error.message}`
    }
    console.error(`${key}: Test error - ${error.message}`)
  } finally {
    isTesting[key] = false
  }
}

const saveSettings = async () => {
  saving.value = true
  
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify(settings)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('Settings saved successfully')
    } else {
      console.error('Failed to save settings:', data.error)
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
