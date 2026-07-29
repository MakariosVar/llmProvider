import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: sessionStorage.getItem('isAuthenticated') === 'true'
  }),
  actions: {
    login() {
      sessionStorage.setItem('isAuthenticated', 'true')
      this.isAuthenticated = true
    },
    logout() {
      sessionStorage.removeItem('isAuthenticated')
      this.isAuthenticated = false
    }
  }
})

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: localStorage.getItem('isDark') === 'true'
  }),
  actions: {
    toggleTheme() {
      this.isDark = !this.isDark
      localStorage.setItem('isDark', this.isDark)
      this.applyTheme()
    },
    applyTheme() {
      if (this.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
})

export const useMonitorStore = defineStore('monitor', {
  state: () => ({
    isActive: false,
    previousPath: '/status'
  }),
  actions: {
    toggle(currentPath) {
      if (this.isActive) {
        this.deactivate()
      } else {
        this.activate(currentPath)
      }
    },
    activate(currentPath) {
      this.previousPath = currentPath;
      this.isActive = true;
    },
    deactivate() {
      this.isActive = false;
    }
  }
})

const CHAT_STORAGE_KEY = 'llm-provider-chat-history'
const ACTIVE_CHAT_KEY = 'llm-provider-active-chat'
const MAX_CONVERSATIONS = 50

function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function makeTitle(messages) {
  const first = messages.find(m => m.role === 'user' && m.content?.trim())
  if (!first) return 'New conversation'
  const text = first.content.trim().replace(/\s+/g, ' ')
  return text.length > 45 ? text.slice(0, 45) + '…' : text
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: loadConversations(),
    activeConversationId: localStorage.getItem(ACTIVE_CHAT_KEY) || null
  }),
  getters: {
    activeConversation(state) {
      return state.conversations.find(c => c.id === state.activeConversationId) || null
    },
    sortedConversations(state) {
      return [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt)
    }
  },
  actions: {
    persist() {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.conversations))
      localStorage.setItem(ACTIVE_CHAT_KEY, this.activeConversationId ?? '')
    },
    createConversation() {
      const id = crypto.randomUUID()
      const now = Date.now()
      const conv = {
        id,
        title: 'New conversation',
        createdAt: now,
        updatedAt: now,
        providerId: '',
        model: '',
        messages: []
      }
      this.conversations.unshift(conv)
      this.activeConversationId = id
      this.persist()
      return id
    },
    saveConversation(messages, providerId, model) {
      if (!messages.length) return

      if (!this.activeConversationId) {
        this.createConversation()
      }

      const idx = this.conversations.findIndex(c => c.id === this.activeConversationId)
      if (idx === -1) {
        this.createConversation()
        return this.saveConversation(messages, providerId, model)
      }

      const existing = this.conversations[idx]
      this.conversations[idx] = {
        ...existing,
        title: existing.title === 'New conversation' ? makeTitle(messages) : existing.title,
        updatedAt: Date.now(),
        providerId: providerId || existing.providerId,
        model: model || existing.model,
        messages: JSON.parse(JSON.stringify(messages))
      }

      if (this.conversations.length > MAX_CONVERSATIONS) {
        const removed = this.conversations
          .filter(c => c.id !== this.activeConversationId)
          .sort((a, b) => a.updatedAt - b.updatedAt)
        while (this.conversations.length > MAX_CONVERSATIONS && removed.length) {
          const oldest = removed.shift()
          this.conversations = this.conversations.filter(c => c.id !== oldest.id)
        }
      }

      this.persist()
    },
    loadConversation(id) {
      const conv = this.conversations.find(c => c.id === id)
      if (!conv) return null
      this.activeConversationId = id
      this.persist()
      return conv
    },
    deleteConversation(id) {
      this.conversations = this.conversations.filter(c => c.id !== id)
      if (this.activeConversationId === id) {
        this.activeConversationId = null
      }
      this.persist()
    },
    clearActive() {
      this.activeConversationId = null
      this.persist()
    }
  }
})
