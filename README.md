# LLM Provider Orchestrator

A robust Node.js server that orchestrates multiple free and paid LLM providers, providing a unified API with failover, circuit breaking, and rate limit management. This tool allows you to maximize your usage of free tiers across various AI services seamlessly.

## Features

- **Unified API**: Single point of entry for multiple LLM and Image providers.
- **Smart Orchestration**: Automatically routes requests to available providers based on priority, health, and heavy-usage capabilities.
- **Image Generation Support**: Dedicated endpoints for generating images using various free providers.
- **High Availability**:
  - **Failover**: Automatically switches to the next available provider if one fails.
  - **Circuit Breaker**: Detects failing providers and temporarily stops sending requests to them.
  - **Rate Limit Management**: Tracks daily and minute-level usage limits to prevent API errors.
- **Real-time Monitoring**: Built-in status tracking via Socket.io.
- **Terminal User Interface (TUI)**: Interactive CLI chat client included.
- **Streaming Support**: Server-Sent Events (SSE) support for streaming responses.

## Supported Providers

### Text Generation
- Google Gemini
- Groq
- Anthropic (Claude)
- Cloudflare Workers AI
- GitHub Models
- Cohere
- HuggingFace
- NVIDIA NIM
- OpenRouter
- NLP Cloud
- APIFreeLLM
- Novita AI
- AI21 Labs
- Mistral AI
- Ollama (Local)

### Image Generation
- Pollinations.ai (No API key required)
- Cloudflare Workers AI (SDXL Lightning, Flux Schnell)
- HuggingFace (via Stable Diffusion models)

## internal Architecture

- **Server (`server.js`)**: Express-based API server with Socket.io for real-time updates. Now supports both Text and Image generation routes.
- **Orchestrator (`src/orchestrator.js`)**: Handles request routing, fallback logic, and provider execution for both LLMs and Image models.
- **Provider Manager (`src/providerManager.js`)**: Manages the state, health, and usage quotas of each provider, now categorized by type.
- **TUI (`src/chatTui.js`)**: A `blessed`-based terminal interface for chatting with the models.

## Prerequisites

- Node.js (v18+ recommended)
- npm

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd llm-provider-server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
     Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your API keys for the providers you wish to use.

## Usage

### Starting the Server

Start the orchestration server:

```bash
npm start
```

The server runs on port `3000` by default.

### Using the Terminal Chat (TUI)

Launch the interactive terminal chat interface:

```bash
npm run chat
```

- **Enter**: Send message.
- **Arrow Keys**: Navigate the provider list.
- **Q / Ctrl+C**: Quit.

### API Usage

#### POST `/api/ai`
Generate text (non-streaming).

**Body:**
```json
{
  "prompt": "Hello, world!",
  "systemPrompt": "You are a helpful assistant.",
  "model": "optional-specific-model-name",
  "temperature": 0.7
}
```

#### POST `/api/ai/image`
Generate an image.

**Body:**
```json
{
  "prompt": "A futuristic city at sunset",
  "model": "flux"
}
```

#### GET `/image?prompt=...`
Quickly generate and view an image in your browser.

**Query Params:**
- `prompt`: The image description (required)
- `model`: Optional model name (e.g., `flux`, `turbo`)

#### POST `/api/ai/stream`
Generate text with streaming response (SSE).

#### GET `/api/status`
Get the current status and usage stats of all providers.

#### GET `/llms`
View the real-time health dashboard in your browser.

## Testing

Run the test suite to verify provider connectivity (includes both text and image models):

```bash
npm test
```
