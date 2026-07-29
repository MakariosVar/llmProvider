<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="$emit('update:isOpen', false)"
  >
    <div class="bg-white border-2 border-black rounded-[1.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[8px_8px_0_#000] animate-modal-in">
      <div class="p-5 border-b-2 border-black flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-black uppercase tracking-tight">Conversation Archive</h2>
          <p class="text-xs font-bold opacity-50 mt-0.5">{{ filteredConversations.length }} session{{ filteredConversations.length !== 1 ? 's' : '' }}</p>
        </div>
        <button
          @click="$emit('update:isOpen', false)"
          class="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-4 border-b-2 border-black shrink-0">
        <input
          v-model="search"
          type="text"
          placeholder="Search conversations..."
          class="w-full px-4 py-3 rounded-[1rem] border-2 border-black outline-none font-medium placeholder:opacity-40"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div v-if="filteredConversations.length === 0" class="text-center py-16 opacity-40">
          <div class="text-4xl mb-3">📭</div>
          <p class="font-black uppercase text-sm">No archived sessions</p>
          <p class="text-xs mt-1">Start a command to create your first conversation</p>
        </div>

        <button
          v-for="(conv, index) in filteredConversations"
          :key="conv.id"
          @click="$emit('select', conv.id)"
          class="w-full text-left p-4 rounded-[1rem] border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] group animate-item-in"
          :class="conv.id === activeId ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'"
          :style="{ animationDelay: `${index * 40}ms` }"
        >
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-black truncate">{{ conv.title }}</p>
              <p class="text-[10px] font-bold uppercase mt-1 opacity-60 truncate">
                {{ conv.providerId || 'auto' }} / {{ conv.model || 'auto' }}
              </p>
              <p class="text-[10px] font-bold mt-2 opacity-50">
                {{ conv.messages.length }} msg{{ conv.messages.length !== 1 ? 's' : '' }} · {{ formatRelative(conv.updatedAt) }}
              </p>
            </div>
            <button
              @click.stop="$emit('delete', conv.id)"
              class="shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              :class="conv.id === activeId ? 'border-white/30 hover:bg-white/20' : 'border-black hover:bg-red-500 hover:text-white hover:border-red-500'"
              title="Delete conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <p v-if="preview(conv)" class="text-xs mt-2 opacity-50 line-clamp-2 font-medium">{{ preview(conv) }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  conversations: { type: Array, default: () => [] },
  activeId: { type: String, default: null }
})

defineEmits(['update:isOpen', 'select', 'delete'])

const search = ref('')

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase()
  const sorted = [...props.conversations].sort((a, b) => b.updatedAt - a.updatedAt)
  if (!q) return sorted
  return sorted.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.messages.some(m => m.content?.toLowerCase().includes(q))
  )
})

const preview = (conv) => {
  const last = [...conv.messages].reverse().find(m => m.content)
  if (!last) return ''
  return last.content.slice(0, 120)
}

const formatRelative = (ts) => {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}
</script>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes item-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-modal-in { animation: modal-in 0.2s ease-out; }
.animate-item-in { animation: item-in 0.25s ease-out both; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
