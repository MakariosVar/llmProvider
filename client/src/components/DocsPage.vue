<template>
  <div class="h-full flex flex-col gap-8 pb-12">
    <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
      <h1 class="text-3xl font-black text-white mb-2">API Documentation</h1>
      <p class="text-slate-400">Complete reference for the LLM Provider API gateway.</p>
    </div>

    <div class="space-y-8">

      <!-- ─────── OVERVIEW ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-indigo-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Overview</h2>
          <p class="text-slate-400 text-sm mt-1">Unified API gateway to 12+ AI providers with automatic failover, rate limiting, and usage analytics.</p>
          <div class="flex flex-wrap gap-3 mt-3">
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"><span class="text-indigo-400 font-bold">Base:</span> <code class="text-slate-300">http://&lt;host&gt;:3000</code></span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"><span class="text-indigo-400 font-bold">Type:</span> <code class="text-slate-300">application/json</code></span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"><span class="text-indigo-400 font-bold">Limit:</span> <code class="text-slate-300">1 MB</code></span>
          </div>
        </div>
      </div>

      <!-- ─────── TEXT GENERATION ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-indigo-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Text Generation</h2>
          <div class="mt-3 space-y-3">

            <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">POST</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/api/ai</code>
              </div>
              <p class="text-slate-500 text-xs mb-2">Text generation with auto failover. Returns content + metadata.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <details class="group text-xs">
                  <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5">
                    <span class="transition-transform group-open:rotate-90">▶</span> Request Body
                  </summary>
                  <pre class="text-slate-500 font-mono mt-1.5 p-2 bg-slate-900 rounded-lg">{"prompt":"What is the capital of France?"}</pre>
                </details>
                <details class="group text-xs">
                  <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5">
                    <span class="transition-transform group-open:rotate-90">▶</span> Response <span class="text-emerald-400">200</span>
                  </summary>
                  <pre class="text-emerald-500 font-mono mt-1.5 p-2 bg-slate-900 rounded-lg">{
  "content":"Paris","provider":"groq",
  "model":"llama-3.1-70b",
  "responseTime":1234,
  "inputTokens":45,"outputTokens":8,"tokens":53
}</pre>
                </details>
              </div>
            </div>

            <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">POST</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/api/ai/stream</code>
              </div>
              <p class="text-slate-500 text-xs mb-2">Streaming text via SSE. Events: <span class="text-indigo-300">start</span> → <span class="text-indigo-300">data</span> (×N) → <span class="text-indigo-300">end</span> → <span class="text-indigo-300">done</span>.</p>
              <details class="group text-xs">
                <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5">
                  <span class="transition-transform group-open:rotate-90">▶</span> Event Stream Example
                </summary>
                <pre class="text-slate-500 font-mono mt-1.5 p-2 bg-slate-900 rounded-lg leading-relaxed">data: {"provider":"groq","model":"llama-3.1-70b"}
data: {"token":"The "}
data: {"token":"capital "}
...
data: {"content":"The capital of France is Paris",
       "responseTime":1234,"tokens":53,
       "inputTokens":45,"outputTokens":8}
data: {}</pre>
              </details>
            </div>

          </div>
        </div>
      </div>

      <!-- ─────── IMAGE GENERATION ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-emerald-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Image Generation</h2>
          <div class="mt-3 space-y-3">

            <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">POST</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/api/ai/image</code>
              </div>
              <p class="text-slate-500 text-xs mb-2">Image generation via Pollinations.ai or Cloudflare.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><span class="text-slate-400 font-bold block mb-0.5">Request</span><pre class="text-slate-500 font-mono p-2 bg-slate-900 rounded-lg">{"prompt":"cybernetic city, 8k"}</pre></div>
                <div><span class="text-slate-400 font-bold block mb-0.5">Response</span><pre class="text-emerald-500 font-mono p-2 bg-slate-900 rounded-lg">{"provider":"Pollinations.ai","model":"flux","imageUrl":"https://..."}</pre></div>
              </div>
            </div>

            <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">GET</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/image?prompt=...</code>
              </div>
              <p class="text-slate-500 text-xs">Quick image gen via query params. Returns binary PNG (Cloudflare) or 302 redirect (Pollinations).</p>
            </div>

          </div>
        </div>
      </div>

      <!-- ─────── STATUS & MONITORING ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-amber-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Status &amp; Monitoring</h2>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/status</code>
              <span class="text-slate-500">— provider status, usage, next model</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/health</code>
              <span class="text-slate-500">— uptime health check</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-indigo-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">POST</span>
              <code class="text-indigo-300 font-mono font-bold">/api/status/check</code>
              <span class="text-slate-500">— trigger health check</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/config</code>
              <span class="text-slate-500">— frontend config</span>
            </span>
          </div>
        </div>
      </div>

      <!-- ─────── ANALYTICS ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-emerald-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Usage Analytics</h2>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/usage/stats</code>
              <span class="text-slate-500">— aggregate stats</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/usage/stats/:timeframe</code>
              <span class="text-slate-500">— Daily/Weekly/Monthly</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/usage/history</code>
              <span class="text-slate-500">— paginated history</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/usage/timeseries</code>
              <span class="text-slate-500">— chart data</span>
            </span>
            <span class="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <span class="bg-emerald-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code class="text-indigo-300 font-mono font-bold">/api/usage/pricing</code>
              <span class="text-slate-500">— model pricing</span>
            </span>
          </div>
        </div>
      </div>

      <!-- ─────── PARAMETERS + ARCHITECTURE ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-indigo-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Request Parameters</h2>
          <p class="text-slate-400 text-xs mt-1">Accepted by <code class="text-indigo-300">POST /api/ai</code> and <code class="text-indigo-300">POST /api/ai/stream</code>.</p>
          <div class="overflow-x-auto mt-3">
            <table class="text-xs text-slate-400 w-full min-w-[450px]">
              <thead>
                <tr class="text-left text-slate-500 border-b border-slate-800">
                  <th class="pb-1.5 pr-3 font-bold">Param</th>
                  <th class="pb-1.5 pr-3 font-bold">Type</th>
                  <th class="pb-1.5 pr-3 font-bold">Req</th>
                  <th class="pb-1.5 pr-3 font-bold">Default</th>
                  <th class="pb-1.5 font-bold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">prompt</td><td class="py-1.5 pr-3">string</td><td class="py-1.5 pr-3 text-emerald-400">Yes</td><td class="py-1.5 pr-3">—</td><td class="py-1.5 text-slate-500">Main instruction</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">providerId</td><td class="py-1.5 pr-3">string</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3"><code class="text-slate-400">auto</code></td><td class="py-1.5 text-slate-500">Force a provider (<code class="text-slate-300">groq</code>, <code class="text-slate-300">google_gemini</code>)</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">model</td><td class="py-1.5 pr-3">string</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3"><code class="text-slate-400">auto</code></td><td class="py-1.5 text-slate-500">Specific model name</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">mode</td><td class="py-1.5 pr-3">string</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3">—</td><td class="py-1.5 text-slate-500"><code class="text-slate-300">fast</code>, <code class="text-slate-300">smart</code>, <code class="text-slate-300">coding</code></td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">temperature</td><td class="py-1.5 pr-3">number</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3"><code class="text-slate-400">0.7</code></td><td class="py-1.5 text-slate-500">Randomness 0–2. Lower = deterministic</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">max_tokens</td><td class="py-1.5 pr-3">number</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3">—</td><td class="py-1.5 text-slate-500">Limit output length</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">systemPrompt</td><td class="py-1.5 pr-3">string</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3">—</td><td class="py-1.5 text-slate-500">System-level instruction</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">messages</td><td class="py-1.5 pr-3">array</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3">—</td><td class="py-1.5 text-slate-500">Chat history <code class="text-slate-300">[{role,content}]</code></td></tr>
                <tr><td class="py-1.5 pr-3 text-indigo-300 font-mono">model (img)</td><td class="py-1.5 pr-3">string</td><td class="py-1.5 pr-3 text-slate-500">No</td><td class="py-1.5 pr-3"><code class="text-slate-400">auto</code></td><td class="py-1.5 text-slate-500">Image model (<code class="text-slate-300">flux</code>, <code class="text-slate-300">turbo</code>)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─────── ARCHITECTURE ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-indigo-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Architecture</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-amber-400 font-bold text-xs block mb-1.5">Provider Selection</span>
              <ol class="text-slate-500 text-xs space-y-0.5 list-decimal list-inside">
                <li>Filter usable providers</li>
                <li>Sort by priority</li>
                <li>Check circuit breaker</li>
                <li>Check rate-limit cache</li>
                <li>Skip recent errors (&lt;5m)</li>
                <li>Try provider; failover on error</li>
              </ol>
            </div>

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-amber-400 font-bold text-xs block mb-1.5">Circuit Breaker</span>
              <ul class="text-slate-500 text-xs space-y-1 list-disc list-inside">
                <li><span class="text-slate-300">Closed</span> — normal</li>
                <li><span class="text-slate-300">Open</span> — 5 fails, 60s reject</li>
                <li><span class="text-slate-300">Half-open</span> — 3 tests</li>
                <li>Per-provider state</li>
              </ul>
            </div>

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="text-amber-400 font-bold text-xs block mb-1.5">Error Classification</span>
              <ul class="text-slate-500 text-xs space-y-1 list-disc list-inside">
                <li><span class="text-red-400">Rate-limited</span> — 429 + 5m cache</li>
                <li><span class="text-slate-300">Transient</span> — 5xx, retry</li>
                <li><span class="text-red-400">Permanent</span> — 4xx, skip</li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <!-- ─────── ERROR CODES ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-red-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Error Codes</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-red-400 font-mono font-bold text-sm">400</span>
              <p class="text-slate-500 text-[11px]">Invalid or missing <code class="text-slate-400">prompt</code></p>
            </div>
            <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-red-400 font-mono font-bold text-sm">429</span>
              <p class="text-slate-500 text-[11px]">Rate limited. Failover auto-triggers</p>
            </div>
            <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-red-400 font-mono font-bold text-sm">500</span>
              <p class="text-slate-500 text-[11px]">All providers exhausted</p>
            </div>
            <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-red-400 font-mono font-bold text-sm">502</span>
              <p class="text-slate-500 text-[11px]">Upstream provider error</p>
            </div>
            <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-red-400 font-mono font-bold text-sm">503</span>
              <p class="text-slate-500 text-[11px]">Circuit breakers open / all down</p>
            </div>
            <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-slate-400 font-mono font-bold text-sm">—</span>
              <p class="text-slate-500 text-[11px]">Error format: <code class="text-slate-400">{"error": "..."}</code></p>
            </div>
          </div>
        </div>
      </div>

      <!-- ─────── REAL-TIME EVENTS ─────── -->
      <div class="flex items-start gap-4">
        <div class="w-1 h-10 bg-indigo-500 rounded-full shrink-0 mt-0.5"></div>
        <div class="flex-1">
          <h2 class="text-lg font-bold text-white">Real-time Events</h2>
          <p class="text-slate-400 text-xs mt-1">Socket.IO events for live monitoring.</p>
          <div class="overflow-x-auto mt-3">
            <table class="text-xs text-slate-400 w-full min-w-[350px]">
              <thead><tr class="text-left text-slate-500 border-b border-slate-800"><th class="pb-1.5 pr-3 font-bold">Event</th><th class="pb-1.5 pr-3 font-bold">Dir</th><th class="pb-1.5 font-bold">Description</th></tr></thead>
              <tbody>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">status_update</td><td class="py-1.5 pr-3 text-emerald-400">→</td><td class="py-1.5 text-slate-500">Provider statuses every 5s</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">usage_update</td><td class="py-1.5 pr-3 text-emerald-400">→</td><td class="py-1.5 text-slate-500">Counters changed</td></tr>
                <tr class="border-b border-slate-800/50"><td class="py-1.5 pr-3 text-indigo-300 font-mono">log</td><td class="py-1.5 pr-3 text-emerald-400">→</td><td class="py-1.5 text-slate-500">Server log messages</td></tr>
                <tr><td class="py-1.5 pr-3 text-indigo-300 font-mono">chat_message</td><td class="py-1.5 pr-3 text-amber-400">←</td><td class="py-1.5 text-slate-500">Chat from TUI clients</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
</script>
