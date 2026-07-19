# AGENTS.md

## Project

LLM Provider Orchestrator — a Node.js (ESM) server that routes requests across multiple LLM/image providers with failover, circuit breaking, and rate-limit tracking. SQLite-backed persistence. Vue 3 + Vite SPA frontend.

## Key Commands

```bash
npm install          # install root deps
npm start            # builds client, then runs server on PORT (default 3000)
npm run build        # full release build: client → esbuild bundle → pkg executable in dist/
npm run test:raw     # runs provider health/functionality tests (hits real APIs)
npm test             # displays test results CLI (does NOT run tests — this is a viewer)
npm run test:view    # test results web viewer
npm run fresh-db     # deletes status.db
npm run chat         # TUI chat client (blessed)
```

**Client-only dev:** `cd client && npm run dev` (Vite dev server, separate from backend)

## Architecture

- `server.js` — Express + Socket.io entry point, API routes, OpenAI-compatible `/v1/chat/completions`
- `src/orchestrator.js` — core routing: provider selection by priority, failover, circuit breaker, streaming
- `src/providerManager.js` — in-memory provider state, usage tracking, rate-limit bookkeeping
- `src/statusPersistence.js` — SQLite (`status.db`) for request history, model status, usage stats
- `src/config.js` — all provider definitions, model lists, rate limits, endpoints. Env vars loaded here via dotenv.
- `src/healthChecker.js` — periodic provider health pings (1 min interval)
- `src/circuitBreaker.js` — failure tracking, open/half-open/closed states
- `src/cli.js` — compiled binary entry point: starts server then TUI dashboard
- `client/` — Vue 3 + Vite + Tailwind CSS SPA, builds to `client/dist/`
- `scripts/build.js` — release build pipeline (client → esbuild → pkg)

## Gotchas

- **ESM only.** `"type": "module"` in root and client `package.json`. Use `import/export`, not `require()`.
- **`npm test` is a viewer, not a test runner.** Use `npm run test:raw` to actually test providers. Filter by provider: `npm run test:raw -- --provider=groq`
- **`npm start` builds the client first** (`cd client && npm run build`). If client build fails, server won't start.
- **`status.db` is created at runtime** by `statusPersistence.js` in the project root. It's gitignored. Delete with `npm run fresh-db` if corrupted.
- **No lint, typecheck, or formatter.** No eslint, prettier, or typescript configured. Code style is informal.
- **Provider configs live in `src/config.js`**, not in separate files. To add/modify providers, edit that file. API keys come from `.env`.
- **Gemini and Anthropic have non-OpenAI API formats** — handled with special-case branches in `orchestrator.js` (`callProvider` and `callProviderStream`).
- **Client builds to `client/dist/`** which is served as static files by Express. The catch-all `*` route serves `client/dist/index.html` for SPA routing.
