<div align="center">

# LLM Provider Orchestrator

**One OpenAI-compatible endpoint in front of every free AI tier you have.**

Route requests across Groq, Gemini, Cloudflare, GitHub Models, Ollama and more —
with automatic failover, circuit breaking and rate-limit accounting, so a single
`429` never has to reach your application.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## The problem

Free tiers are generous but fragmented. Groq gives you 30 RPM, Gemini gives you
1,500 requests a day, Cohere gives you 33, and your own Ollama box gives you
unlimited — but they all speak slightly different dialects, they all rate-limit
differently, and half of them will silently start failing at 2am.

Doing this by hand means writing retry logic for every provider, tracking which
one is currently throttled, and hoping you don't burn your whole daily quota on
one flaky endpoint.

**This does that part for you.** You keep hitting a single URL. It figures out
who can actually serve the request right now.

## Features

**Routing**

- **Priority-based selection** — providers are tried in a configurable order; each one's models are tried in order too.
- **Automatic failover** — a failed model falls through to the next model, then the next provider, within the same request.
- **Circuit breaker** — a provider that keeps failing is pulled out of rotation for 60s, then probed again before being trusted.
- **Rate-limit awareness** — `429`s are cached for 5 minutes instead of being retried, and quota is read live from provider response headers where available.
- **Error classification** — transient errors (timeouts, 5xx, DNS) don't mark a provider unhealthy; only permanent errors do.
- **Local models** — Ollama is discovered automatically and its live model list is synced.

**Persistence & observability**

- **SQLite-backed** (`status.db`) — provider health, live rate limits and usage counters survive a restart.
- **Per-request metrics** — latency, token estimates, success/failure, all queryable.
- **Usage analytics** — daily/weekly/monthly charts, per-provider and per-model leaderboards, token throughput, estimated cost savings.
- **Cost estimation** — model pricing is synced from OpenRouter to show what your free quota is worth.

**Interfaces**

- **Web dashboard** (Vue 3 + Vite) — Status, Chat, Compare, Images, Speech, Usage, Quota, API docs and Settings.
- **OpenAI-compatible API** — point any OpenAI client at it and it just works, streaming included.
- **Terminal dashboard** — a `blessed` TUI with live logs, usage, and provider health, shown next to the server.
- **Terminal chat client** — a TUI chat that talks to the running server over Socket.io.
- **Standalone binary** — `npm run build` produces a single self-contained executable.

## Quick start

Requires **Node.js 20+** (22 recommended — it's what the release build targets).

```bash
git clone https://github.com/MakariosVar/llmProvider.git
cd llmProvider

npm install
cd client && npm install && cd ..   # the dashboard is a separate workspace

cp .env.example .env                # then paste in your keys
npm start
```

Open <http://localhost:3000>.

> `npm start` builds the Vue client first, so the first run takes a moment. If the client build fails, the server won't start.

You need **at least one** provider key — or a running [Ollama](https://ollama.com) — before anything routes.
[Pollinations](https://pollinations.ai) and OVHcloud need no key at all.

### Try the API

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "messages": [{"role": "user", "content": "Why is the sky blue?"}]
  }'
```

Swap the URL for any OpenAI client — Open WebUI, Continue, Aider, LangChain, your own code:

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:3000/v1", api_key="unused")
client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Hello"}],
)
```

## Providers

All configuration lives in [`src/config.js`](src/config.js) — models, limits and priorities are one edit away.

### Text

| Provider | Key | Notes |
|---|---|---|
| [Groq](https://console.groq.com) | `GROQ_API_KEY` | Also serves **Whisper** speech-to-text |
| [Kilo Code](https://kilo.ai) | `KILOCODE_API_KEY` | Free gateway, very high limits |
| [Z.ai](https://z.ai) | `ZAI_API_KEY` | GLM free tier |
| [NVIDIA NIM](https://build.nvidia.com) | `NVIDIA_API_KEY` | Developer credits |
| [Mistral AI](https://console.mistral.ai) | `MISTRAL_API_KEY` | Experimentation tier |
| [GitHub Models](https://github.com/marketplace/models) | `GITHUB_TOKEN` | Needs a PAT with model access |
| [OVHcloud](https://endpoints.ai.cloud.ovh.net) | — | Keyless |
| [Google Gemini](https://aistudio.google.com/apikey) | `GEMINI_API_KEY` | Non-OpenAI request format |
| [Cohere](https://dashboard.cohere.com) | `COHERE_API_KEY` | Very tight free quota |
| [OpenRouter](https://openrouter.ai) | `OPENROUTER_API_KEY` | Credits-based |
| [Cloudflare Workers AI](https://workers.cloudflare.com) | `CLOUDFLARE_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | Text + image |
| [Novita AI](https://novita.ai) | `NOVITA_API_KEY` | Credits-based |
| [Ollama](https://ollama.com) | `OLLAMA_HOST` | Local, unlimited |

### Image

| Provider | Key | Notes |
|---|---|---|
| [Pollinations](https://pollinations.ai) | — | Keyless |
| [Cloudflare Workers AI](https://workers.cloudflare.com) | `CLOUDFLARE_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | Flux, SDXL |

> Cerebras and HuggingFace are present in `src/config.js` but commented out — HuggingFace ended its free inference API. Uncomment them if you have keys.

### Speech-to-text

Transcription is routed through Groq's Whisper models and needs `GROQ_API_KEY`. It is not pluggable to other providers yet.

## API

Base URL: `http://localhost:3000`

### OpenAI-compatible

#### `POST /v1/chat/completions`

Accepts a standard OpenAI chat completion request and returns a standard OpenAI response — including SSE streaming that terminates with `data: [DONE]`.

```json
{
  "model": "openai/gpt-oss-120b",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "temperature": 0.7,
  "max_tokens": 100,
  "stream": false
}
```

```json
{
  "id": "chatcmpl-1740000000000a1b2c3",
  "object": "chat.completion",
  "created": 1740000000,
  "model": "openai/gpt-oss-120b",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "The capital of France is Paris." },
    "finish_reason": "stop"
  }],
  "usage": { "prompt_tokens": 14, "completion_tokens": 6, "total_tokens": 20 }
}
```

Leave `model` unset to let the orchestrator choose. Setting it restricts routing to providers that actually serve that model.

> There is no `/v1/models` endpoint. Use `GET /api/status` to see what's configured and healthy.

### Native endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai` | Text generation (non-streaming) |
| `POST` | `/api/ai/stream` | Text generation as SSE (`start` / `data` / `end` / `error` events) |
| `POST` | `/api/ai/image` | Image generation → `{ provider, model, imageUrl }` |
| `POST` | `/api/ai/transcribe` | Speech-to-text, `multipart/form-data`, field `file` (max 100 MB) |
| `GET` | `/image?prompt=...` | Image as a direct URL or redirect |
| `GET` | `/api/status` | Full provider + model health snapshot, live usage, next candidate |
| `POST` | `/api/status/check` | Force a live per-model probe across all providers |
| `GET` | `/api/usage/stats` | Aggregate usage + configured provider limits |
| `GET` | `/api/usage/stats/:timeframe` | `Daily` \| `Weekly` \| `Monthly` |
| `GET` | `/api/usage/history` | Paginated history — `limit`, `offset`, `providerId`, `modelName`, `status`, `sortBy`, `sortOrder` |
| `GET` | `/api/usage/timeseries` | `interval=minute\|hour\|day\|month`, `metric=requests\|tokens\|latency` |
| `GET` | `/api/usage/pricing` | Synced model pricing table |
| `GET` | `/health` | Liveness probe |
| `POST` | `/api/login` | Admin login → bearer token |
| `GET`/`POST` | `/api/settings` | Read / write `.env` (**token required**) |
| `POST` | `/api/settings/test/:key` | Validate a provider key (**token required**) |

### Real-time events (Socket.io)

The server emits `status_update` and `usage_update` on connect, after every request, and every 5 seconds. It accepts `chat_message` for chat from a socket client.

## How routing works

For each request the orchestrator walks providers in ascending `priority`:

1. Skip the provider if its circuit breaker is open, or if the model is currently rate-limited.
2. Try **each model of that provider** in order.
3. On success — record usage, clear the rate-limit cache, and tell the circuit breaker.
4. On `429` — cache the model as throttled for 5 minutes and move on *without* counting it as a failure.
5. On a transient error (timeout, 5xx, connection refused) — log it, count it toward the breaker, but don't mark the model broken.
6. On a permanent error (auth, bad request) — mark the model failed for 5 minutes and count it toward the breaker.
7. If everything is exhausted, return `AllProvidersFailedError` with the full list of per-provider errors.

Circuit breaker: opens after **5 failures**, stays open for **60 seconds**, then allows **3** half-open probes before closing again. State is in-memory and resets on restart; the SQLite-backed rate-limit cache does not.

## Configuration

Everything is environment-driven — see [`.env.example`](.env.example) for the full annotated list.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `admin` | Credentials for the dashboard Settings page |
| `MAX_PROMPT_TOKENS` | `30000` | Rejects oversized prompts |
| `MAX_SYSTEM_TOKENS` | `5000` | Rejects oversized system prompts |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins for Socket.io |
| `OLLAMA_HOST` | `http://localhost:11434` | Local Ollama endpoint |
| `GROQ_API_KEY` … | — | One variable per provider, see the table above |

Runtime state lives in `status.db`, created automatically in the project root. Wipe it with `npm run fresh-db`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Build the client, then run the server |
| `npm run build` | Full release build → single binary in `dist/` |
| `npm test` | Interactive provider test runner (**makes real API calls**) |
| `npm run test:raw` | Same tests, non-interactive, for CI |
| `npm run test:view` | Test results in a browser on port 3001 |
| `npm run chat` | TUI chat client against a running server |
| `npm run fresh-db` | Delete `status.db` |

> ⚠️ `npm test` and `npm run test:raw` send **real requests to every configured provider**. On free tiers that eats into your daily quota. Filter first:
> ```bash
> npm run test:raw -- --provider=groq
> npm run test:raw -- --providers=groq,google_gemini
> ```

Client-only development, with hot reload against a separately running server:

```bash
cd client && npm run dev
```

## Architecture

```
server.js              Express + Socket.io entry point, API routes
src/orchestrator.js    Provider selection, failover, streaming, per-provider adapters
src/providerManager.js In-memory provider state, usage and rate-limit bookkeeping
src/circuitBreaker.js  Per-provider open/half-open/closed state machine
src/healthChecker.js   Background health probes (1 min) and forced deep checks
src/statusPersistence.js  SQLite: model status, usage, history, pricing
src/pricingManager.js  OpenRouter pricing sync (every 4h)
src/config.js          Providers, models, limits, priorities, endpoints
src/dashboard.js       TUI dashboard
src/chatTui.js         TUI chat client
scripts/build.js       client → esbuild → pkg executable
client/                Vue 3 + Vite + Tailwind dashboard
```

Provider model lists churn constantly. If a model starts 404ing, update `src/config.js` and commit.

## Security

**Read this before exposing the server to a network.** It is designed to run on `localhost`.

- **Almost everything is unauthenticated.** Only `/api/settings*` requires a bearer token. `/api/ai`, `/api/ai/stream`, `/api/ai/image`, `/api/ai/transcribe` and `/v1/chat/completions` are open to anyone who can reach the port — which means anyone can drain your free quota.
- **`/api/settings` returns your `.env` in plaintext.** A valid session token exposes every API key you have configured. Combined with the default `admin`/`admin` credentials, that is a full credential dump.
- **CORS is `*` by default** and there is no rate limiting on `/api/login`, so the admin password is brute-forceable from a browser.
- **The TUI dashboard has a `t` keybind that opens a public [localtunnel](https://theboroer.github.io/localtunnel-www/) URL.** That publishes the whole unauthenticated server to the internet in one keystroke.

Minimum hardening before putting this anywhere but localhost: change `ADMIN_PASSWORD`, set `ALLOWED_ORIGINS` to specific origins, and put it behind a reverse proxy that handles authentication and TLS.

## Contributing

Contributions are welcome — provider adapters and bug reports especially. Please open an issue before large changes so we don't duplicate work. Model lists change weekly, so a PR that adds or fixes a model is genuinely useful.

By contributing you agree that your work is licensed under the [MIT License](LICENSE).

## License

[MIT](LICENSE) © 2026 MakariosVar

You are responsible for complying with each provider's terms of service and for any charges your accounts incur.