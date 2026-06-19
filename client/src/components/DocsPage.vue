<template>
  <div class="relative">
    <div class="flex gap-8">
      <div class="flex-1 min-w-0 space-y-12 pb-24">

        <!-- ═══ HERO ═══ -->
        <section id="hero" class="relative overflow-hidden rounded-3xl p-10 border border-slate-800/60 hero-section">
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">REST API</span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">12+ Providers</span>
            </div>
            <h1 class="text-4xl font-black text-white mb-3 tracking-tight">API <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-400">Documentation</span></h1>
            <p class="text-slate-400 text-lg max-w-2xl">Unified API gateway to 12+ AI providers with automatic failover, rate limiting, and usage analytics.</p>
            <div class="flex flex-wrap gap-3 mt-6">
              <span class="px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700/50 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                Base: <code class="text-indigo-300 font-bold">http://&lt;host&gt;:3000</code>
              </span>
              <span class="px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700/50 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
                Type: <code class="text-emerald-300 font-bold">application/json</code>
              </span>
              <span class="px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700/50 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                Limit: <code class="text-amber-300 font-bold">1 MB</code>
              </span>
            </div>
          </div>
        </section>

        <!-- ═══ TEXT GENERATION ═══ -->
        <section id="text-gen" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-indigo-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Text Generation</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">Generate text with auto failover across providers.</p>
            </div>
          </div>
          <div class="mt-5 space-y-4">
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
              <div class="flex items-center gap-2.5 mb-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold text-white bg-indigo-500">POST</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/api/ai</code>
              </div>
              <p class="text-slate-500 text-sm mb-3">Text generation with auto failover. Returns content + metadata.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <details class="group">
                  <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5 text-xs">
                    <span class="transition-transform group-open:rotate-90">&#9654;</span> Request Body
                  </summary>
                  <pre class="text-slate-500 font-mono mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-xs overflow-x-auto">{"prompt":"What is the capital of France? (answer in 5 words)"}</pre>
                </details>
                <details class="group">
                  <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5 text-xs">
                    <span class="transition-transform group-open:rotate-90">&#9654;</span> Response <span class="text-emerald-400">200</span>
                  </summary>
                  <pre class="text-emerald-500 font-mono mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-xs">{
  "provider":"Groq",
  "model":"meta-llama/llama-4-scout-17b-16e-instruct",
  "content":"The capital is Paris France.",
  "responseTime":110,
  "inputTokens":14,"outputTokens":6,"tokens":20
}</pre>
                </details>
              </div>
            </div>
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
              <div class="flex items-center gap-2.5 mb-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold text-white bg-indigo-500">POST</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/api/ai/stream</code>
              </div>
              <p class="text-slate-500 text-sm mb-3">Streaming text via SSE. Events: start &#8594; data (&#215;N) &#8594; end &#8594; done.</p>
              <details class="group sm:col-span-2">
                <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5 text-xs">
                  <span class="transition-transform group-open:rotate-90">&#9654;</span> Event Stream Example
                </summary>
                <pre class="text-slate-500 font-mono mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-xs leading-relaxed">event: start
data: {"provider":"Groq","model":"meta-llama/llama-4-scout-17b-16e-instruct"}

event: data
data: {"token":"1"}

event: data
data: {"token":", "}

event: data
data: {"token":"2"}

event: data
data: {"token":", "}

event: data
data: {"token":"3"}

event: data
...</pre>
              </details>
            </div>
          </div>
        </section>

        <!-- ═══ IMAGE GENERATION ═══ -->
        <section id="image-gen" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-emerald-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Image Generation</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">Generate images via Pollinations.ai or Cloudflare.</p>
            </div>
          </div>
          <div class="mt-5 space-y-4">
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
              <div class="flex items-center gap-2.5 mb-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold text-white bg-emerald-500">POST</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/api/ai/image</code>
              </div>
              <p class="text-slate-500 text-sm mb-3">Image generation. Returns provider, model, and imageUrl.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <details class="group">
                  <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5 text-xs">
                    <span class="transition-transform group-open:rotate-90">&#9654;</span> Request Body
                  </summary>
                  <pre class="text-slate-500 font-mono mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-xs">{"prompt":"A simple red circle on white background"}</pre>
                </details>
                <details class="group">
                  <summary class="text-slate-400 font-bold cursor-pointer hover:text-slate-200 list-none flex items-center gap-1.5 text-xs">
                    <span class="transition-transform group-open:rotate-90">&#9654;</span> Response <span class="text-emerald-400">200</span>
                  </summary>
                  <pre class="text-emerald-500 font-mono mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-xs">{"provider":"Pollinations.ai","model":"flux","imageUrl":"https://image.pollinations.ai/prompt/A%20simple%20red%20circle%20on%20white%20background?model=flux&nologo=true"}</pre>
                </details>
              </div>
            </div>
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
              <div class="flex items-center gap-2.5 mb-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold text-white bg-emerald-500">GET</span>
                <code class="text-indigo-300 font-mono font-bold text-sm">/image?prompt=...</code>
              </div>
              <p class="text-slate-500 text-sm">Quick image gen via query params. Returns binary PNG (Cloudflare) or 302 redirect (Pollinations).</p>
            </div>
          </div>
        </section>

        <!-- ═══ STATUS & MONITORING ═══ -->
        <section id="monitoring" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-amber-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Status &amp; Monitoring</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">Health checks, provider status, and configuration endpoints.</p>
            </div>
          </div>
          <div class="mt-5">
            <div class="flex flex-wrap gap-1.5">
              <button v-for="(tab, i) in monitoringTabs" :key="i"
                @click="activeMonitoringTab = i"
                class="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer"
                :class="activeMonitoringTab === i
                  ? 'bg-slate-800 border-indigo-500/50 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'">
                <span class="px-1 py-0.5 rounded text-[10px] font-bold text-white"
                  :class="tab.color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'">{{ tab.method }}</span>
                <code class="font-mono font-bold">{{ tab.path }}</code>
                <span class="text-slate-500">— {{ tab.desc }}</span>
              </button>
            </div>
            <div class="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Response 200</div>
              <pre class="text-emerald-500 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">{{ monitoringTabs[activeMonitoringTab].sample }}</pre>
            </div>
          </div>
        </section>

        <!-- ═══ ANALYTICS ═══ -->
        <section id="analytics" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-emerald-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Usage Analytics</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">Track usage, history, pricing, and trends across all providers.</p>
            </div>
          </div>
          <div class="mt-5">
            <div class="flex flex-wrap gap-1.5">
              <button v-for="(tab, i) in analyticsTabs" :key="i"
                @click="activeAnalyticsTab = i"
                class="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer"
                :class="activeAnalyticsTab === i
                  ? 'bg-slate-800 border-indigo-500/50 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'">
                <span class="px-1 py-0.5 rounded text-[10px] font-bold text-white bg-emerald-500">{{ tab.method }}</span>
                <code class="font-mono font-bold">{{ tab.path }}</code>
                <span class="text-slate-500">— {{ tab.desc }}</span>
              </button>
            </div>
            <div class="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Response 200</div>
              <pre class="text-emerald-500 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">{{ analyticsTabs[activeAnalyticsTab].sample }}</pre>
            </div>
          </div>
        </section>

        <!-- ═══ REQUEST PARAMETERS ═══ -->
        <section id="params" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-indigo-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Request Parameters</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">Accepted by POST /api/ai and POST /api/ai/stream.</p>
            </div>
          </div>
          <div class="overflow-x-auto mt-5 rounded-2xl border border-slate-800">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-900/80">
                  <th class="text-left px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider">Param</th>
                  <th class="text-left px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider">Type</th>
                  <th class="text-center px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider">Required</th>
                  <th class="text-left px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider">Default</th>
                  <th class="text-left px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider pr-8">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in params" :key="p.name" class="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 transition-colors">
                  <td class="px-5 py-3 font-mono font-bold text-indigo-300 whitespace-nowrap">{{ p.name }}</td>
                  <td class="px-5 py-3 text-slate-400">{{ p.type }}</td>
                  <td class="px-5 py-3 text-center"><span :class="p.req ? 'text-emerald-400' : 'text-slate-600'" class="font-bold">{{ p.req ? 'Yes' : 'No' }}</span></td>
                  <td class="px-5 py-3 text-slate-400 font-mono text-xs">{{ p.default }}</td>
                  <td class="px-5 py-3 text-slate-500 pr-8" v-html="p.desc"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ═══ ARCHITECTURE ═══ -->
        <section id="architecture" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-indigo-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Architecture</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">How the gateway selects, monitors, and fails over between providers.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-2.5 mb-3">
                <span class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                </span>
                <span class="font-bold text-sm text-white">Provider Selection</span>
              </div>
              <ol class="text-slate-400 text-sm space-y-1.5 list-decimal list-inside">
                <li>Filter usable providers</li>
                <li>Sort by priority</li>
                <li>Check circuit breaker</li>
                <li>Check rate-limit cache</li>
                <li>Skip recent errors (&lt;5m)</li>
                <li>Try provider; failover on error</li>
              </ol>
            </div>
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-2.5 mb-3">
                <span class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </span>
                <span class="font-bold text-sm text-white">Circuit Breaker</span>
              </div>
              <ul class="text-slate-400 text-sm space-y-1.5">
                <li><span class="text-emerald-400 font-semibold">Closed</span> — normal operation</li>
                <li><span class="text-red-400 font-semibold">Open</span> — 5 fails, 60s reject</li>
                <li><span class="text-amber-400 font-semibold">Half-open</span> — 3 probe tests</li>
                <li>Per-provider state machine</li>
              </ul>
            </div>
            <div class="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-2.5 mb-3">
                <span class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                </span>
                <span class="font-bold text-sm text-white">Error Classification</span>
              </div>
              <ul class="text-slate-400 text-sm space-y-1.5">
                <li><span class="text-red-400 font-semibold">Rate-limited</span> — 429 + 5m cache</li>
                <li><span class="text-slate-300 font-semibold">Transient</span> — 5xx, auto-retry</li>
                <li><span class="text-red-400 font-semibold">Permanent</span> — 4xx, skip</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ═══ ERROR CODES ═══ -->
        <section id="errors" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-red-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 border border-red-500/30">
                  <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Error Codes</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">HTTP status codes and their meaning in the API.</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div v-for="e in errorCodes" :key="e.code" class="p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
              <span class="font-mono font-bold text-lg" :class="e.code === '—' ? 'text-slate-400' : 'text-red-400'">{{ e.code }}</span>
              <p class="text-slate-500 text-sm mt-0.5" v-html="e.desc"></p>
            </div>
          </div>
        </section>

        <!-- ═══ REAL-TIME EVENTS ═══ -->
        <section id="realtime" class="scroll-mt-24">
          <div class="flex items-start gap-4">
            <div class="w-1 h-10 shrink-0 mt-0.5 rounded-full bg-indigo-500"></div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"/></svg>
                </span>
                <h2 class="text-xl font-bold text-white">Real-time Events</h2>
              </div>
              <p class="text-slate-400 text-sm mt-0.5 ml-11">Socket.IO events for live monitoring and updates.</p>
            </div>
          </div>
          <div class="overflow-x-auto mt-5 rounded-2xl border border-slate-800">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-900/80">
                  <th class="text-left px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider">Event</th>
                  <th class="text-center px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider">Direction</th>
                  <th class="text-left px-5 py-3 font-bold text-slate-400 uppercase text-xs tracking-wider pr-8">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ev in realtimeEvents" :key="ev.event" class="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 transition-colors">
                  <td class="px-5 py-3 font-mono font-bold text-indigo-300">{{ ev.event }}</td>
                  <td class="px-5 py-3 text-center"><span :class="ev.dir === '→' ? 'text-emerald-400' : 'text-amber-400'" class="font-bold text-lg">{{ ev.dir }}</span></td>
                  <td class="px-5 py-3 text-slate-500 pr-8">{{ ev.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>

    <button @click="scrollTo('hero')"
      class="fixed bottom-8 right-8 z-50 p-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white shadow-2xl transition-all duration-200 backdrop-blur-sm border border-indigo-400/30"
      :class="showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showBackToTop = ref(false)

const scrollTo = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

let scrollHandler
onMounted(() => {
  scrollHandler = () => { showBackToTop.value = window.scrollY > 600 }
  window.addEventListener('scroll', scrollHandler, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandler)
})

const monitoringTabs = [
  { method: 'GET', path: '/api/status', color: 'amber', desc: 'Provider status, usage, next model', sample: '[{"id":"groq","name":"Groq","status":"online","models":[...],"usage":{"daily":12,"monthly":135}},...]' },
  { method: 'GET', path: '/health', color: 'amber', desc: 'Health check', sample: '{"status":"ok","uptime":512.6}' },
  { method: 'POST', path: '/api/status/check', color: 'indigo', desc: 'Trigger health check', sample: '{"status":"completed","message":"Health check completed for 12 providers"}' },
]
const activeMonitoringTab = ref(0)

const analyticsTabs = [
  { method: 'GET', path: '/api/usage/stats', color: 'emerald', desc: 'Aggregate stats', sample: '{"summary":{"totalRequests":281,"successRequests":274,"totalInputTokens":3955,"totalOutputTokens":162113,"avgLatency":2243},"providers":[...]}' },
  { method: 'GET', path: '/api/usage/stats/:timeframe', color: 'emerald', desc: 'Daily / Weekly / Monthly', sample: '{"timeframe":"24h","totalRequests":42,"successRequests":40,"avgLatency":1234}' },
  { method: 'GET', path: '/api/usage/history', color: 'emerald', desc: 'Paginated request history', sample: '{"data":[{"provider":"groq","latency":110,"tokens":20}],"total":42,"limit":100,"offset":0}' },
  { method: 'GET', path: '/api/usage/timeseries', color: 'emerald', desc: 'Chart data', sample: '[{"label":"2026-06-18","value":125},{"label":"2026-06-19","value":156}]' },
  { method: 'GET', path: '/api/usage/pricing', color: 'emerald', desc: 'Per-model pricing', sample: '[{"model_name":"groq/meta-llama/llama-4-scout-17b-16e-instruct","prompt_price":5e-8,"completion_price":2e-7,"rating":5},...]' },
]
const activeAnalyticsTab = ref(0)

const params = [
  { name: 'prompt', type: 'string', req: true, default: '—', desc: 'Main instruction for the model' },
  { name: 'providerId', type: 'string', req: false, default: 'auto', desc: 'Force a provider (<code class="text-indigo-300">groq</code>, <code class="text-indigo-300">google_gemini</code>)' },
  { name: 'model', type: 'string', req: false, default: 'auto', desc: 'Specific model name' },
  { name: 'mode', type: 'string', req: false, default: '—', desc: '<code class="text-indigo-300">fast</code>, <code class="text-indigo-300">smart</code>, <code class="text-indigo-300">coding</code>' },
  { name: 'temperature', type: 'number', req: false, default: '0.7', desc: 'Randomness 0–2. Lower = deterministic' },
  { name: 'max_tokens', type: 'number', req: false, default: '—', desc: 'Limit output length' },
  { name: 'systemPrompt', type: 'string', req: false, default: '—', desc: 'System-level instruction' },
  { name: 'messages', type: 'array', req: false, default: '—', desc: 'Chat history <code class="text-indigo-300">[{role,content}]</code>' },
  { name: 'model (img)', type: 'string', req: false, default: 'auto', desc: 'Image model (<code class="text-indigo-300">flux</code>, <code class="text-indigo-300">turbo</code>)' },
]

const errorCodes = [
  { code: '400', desc: 'Invalid or missing <code class="text-indigo-300">prompt</code>' },
  { code: '429', desc: 'Rate limited — failover auto-triggers' },
  { code: '500', desc: 'All providers exhausted' },
  { code: '502', desc: 'Upstream provider error' },
  { code: '503', desc: 'Circuit breakers open / all down' },
  { code: '—', desc: 'Error format: <code class="text-indigo-300">{"error": "..."}</code>' },
]

const realtimeEvents = [
  { event: 'status_update', dir: '→', desc: 'Provider statuses every 5s' },
  { event: 'usage_update', dir: '→', desc: 'Counters changed' },
  { event: 'log', dir: '→', desc: 'Server log messages' },
  { event: 'chat_message', dir: '←', desc: 'Chat from TUI clients' },
]
</script>

<style scoped>
.hero-section {
  background:
    radial-gradient(ellipse 80% 60% at 0% 50%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(ellipse 80% 60% at 100% 50%, rgba(52, 211, 153, 0.08), transparent),
    var(--bg-color);
}
.scroll-mt-24 {
  scroll-margin-top: 6rem;
}
/* Prevent pre overflow in expanded details */
details > pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>