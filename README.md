# LLM Provider Orchestrator

A robust Node.js server that orchestrates multiple free and paid LLM providers, providing a unified API with failover, circuit breaking, and rate limit management. This tool allows you to maximize your usage of free tiers across various AI services seamlessly.

## Features

- **Unified API**: Single point of entry for multiple LLM and Image providers.
- **Smart Orchestration**: Automatically routes requests to available providers based on priority, health, and heavy-usage capabilities.
- **Persistent Storage**: Uses **SQLite** to track model health, rate limits, and failure history across restarts.
- **High Availability**:
  - **Failover**: Automatically switches to the next available provider if one fails.
  - **Circuit Breaker**: Detects failing providers and temporarily stops sending requests to them.
  - **Rate Limit Management**: Tracks daily and minute-level usage limits.
- **Rich Dashboard**:
  - **System Status**: Real-time health monitoring of all providers and models.
  - **Command Center**: Full-featured chat interface with streaming and conversational memory.
  - **Model Compare**: Side-by-side technical comparison with latency and token-per-second metrics.
  - **Test API**: Interactive code builder and documentation for developers.
- **Performance Tracking**: Measures response latency and estimates token usage for every request.
- **Terminal User Interface (TUI)**: Interactive CLI chat client included.
- **Streaming Support**: Server-Sent Events (SSE) support for real-time responses.

## Supported Providers

### Text Generation
- Google Gemini, Groq, Anthropic (Claude), Cloudflare Workers AI, GitHub Models, Cohere, HuggingFace, NVIDIA NIM, OpenRouter, NLP Cloud, APIFreeLLM, Mistral AI, Ollama (Local), and more.

### Image Generation
- Pollinations.ai, Cloudflare Workers AI (Flux, SDXL), HuggingFace.

## Internal Architecture

- **Server (`server.js`)**: Express server with Socket.io and SQLite persistence.
- **Orchestrator (`src/orchestrator.js`)**: Core routing logic with support for streaming and history.
- **Status Persistence (`src/statusPersistence.js`)**: SQLite-backed storage for model reliability tracking.
- **Client (Vue 3)**: Modern frontend for interaction and monitoring.

## Prerequisites

- Node.js (v18+)
- npm

## Installation

1.  Clone and install:
    ```bash
    npm install
    ```

2.  Configure:
    ```bash
    cp .env.example .env
    # Add your API keys to .env
    ```

3.  Start:
    ```bash
    npm start
    ```

## Usage

### Web Dashboard
Access the UI at `http://localhost:3000` to monitor status, chat, compare models, and get API snippets.

### API Integration

#### POST `/api/ai/stream` (Recommended)
Streaming text generation with conversation memory.

**Body:**
```json
{
  "prompt": "Tell me a joke",
  "messages": [{"role": "user", "content": "Hi"}],
  "providerId": "google_gemini"
}
```

#### POST `/api/ai`
Standard non-streaming text generation.

#### POST `/api/ai/image`
Image generation via Pollinations or Cloudflare.

## Testing

Verify your setup and provider health:
```bash
npm test
```
