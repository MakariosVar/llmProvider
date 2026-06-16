import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    agentUrl: process.env.AGENT_URL || 'http://localhost:3001',
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin'
    },
    providers: {
        groq: {
            name: 'Groq (Free)',
            key: process.env.GROQ_API_KEY,
            models: [
                'meta-llama/llama-4-scout-17b-16e-instruct', // Verified PASS
                'llama-3.3-70b-versatile',                  // Verified in listing
                'openai/gpt-oss-120b',                       // Verified PASS
                'qwen/qwen3-32b',                            // Verified PASS
                'openai/gpt-oss-20b',
                'llama-3.1-8b-instant'
            ],
            rpm: 60,
            daily_limit: 2000,
            priority: 1,
            heavy_usage: 90,
            endpoint: 'https://api.groq.com/openai/v1/chat/completions'
        },
        cerebras: {
            name: 'Cerebras (Free Tier)',
            key: process.env.CEREBRAS_API_KEY,
            models: [
                'gpt-oss-120b',   // Verified PASS
                'zai-glm-4.7',     // Verified PASS
            ],
            rpm: 30,
            daily_limit: 1000000, // 1M tokens/day free
            priority: 2,
            heavy_usage: 92,
            endpoint: 'https://api.cerebras.ai/v1/chat/completions'
        },
        mistral_ai: {
            name: 'Mistral AI (free-tier)',
            key: process.env.MISTRAL_API_KEY || null,
            models: ['mistral-small-latest', 'open-mistral-nemo'],
            rpm: 30,
            daily_limit: 1000000000,
            priority: 3,
            heavy_usage: 65,
            endpoint: 'https://api.mistral.ai/v1/chat/completions'
        },
        github: {
            name: 'GitHub Models',
            key: process.env.GITHUB_TOKEN,
            models: [
                'gpt-4o',
                'gpt-4o-mini',
                'Meta-Llama-3.1-405B-Instruct',
                'Meta-Llama-3.1-8B-Instruct'
            ],
            rpm: 15,
            daily_limit: 1000,
            priority: 4,
            heavy_usage: 78,
            endpoint: 'https://models.inference.ai.azure.com/chat/completions',
            headers: {
                'X-GitHub-Api-Version': '2026-03-10',
                'Accept': 'application/vnd.github+json'
            }
        },
        google_gemini: {
            name: 'Google Gemini (Free)',
            key: process.env.GEMINI_API_KEY,
            models: [
                'gemini-3.5-flash',       // Latest free stable (May 2026)
                'gemini-3.1-flash-lite',  // Efficiency leader
            ],
            rpm: 15,                      // Rate limits for free tier
            daily_limit: 1500,
            priority: 5,
            heavy_usage: 95,
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
        },
        huggingface: {
            name: 'HuggingFace',
            key: process.env.HF_API_KEY,
            models: ['meta-llama/Meta-Llama-3-8B-Instruct', 'Qwen/Qwen2.5-7B-Instruct'],
            rpm: 5,
            daily_limit: 30,
            priority: 6,
            heavy_usage: 60,
            endpoint: 'https://router.huggingface.co/v1/chat/completions'
        },
        cohere: {
            name: 'Cohere',
            key: process.env.COHERE_API_KEY,
            models: ['command-a-plus-05-2026', 'command-a-03-2025'],
            rpm: 20,
            daily_limit: 1000,
            priority: 7,
            heavy_usage: 72,
            endpoint: 'https://api.cohere.ai/v2/chat'
        },
        openrouter: {
            name: 'OpenRouter',
            key: process.env.OPENROUTER_API_KEY,
            models: [
                'openrouter/auto',
            ],
            rpm: 20,
            daily_limit: 200,
            priority: 8,
            heavy_usage: 70,
            endpoint: 'https://openrouter.ai/api/v1/chat/completions'
        },
        cloudflare: {
            name: 'Cloudflare Workers AI',
            key: process.env.CLOUDFLARE_TOKEN,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            models: [
                "@cf/meta/llama-4-scout-17b-16e-instruct",
                "@cf/moonshotai/kimi-k2.7-code",
                "@cf/zai-org/glm-4.7-flash",
                "@cf/google/gemma-4-26b-a4b-it",
            ],
            rpm: 30,
            daily_limit: 10000,
            priority: 9,
            heavy_usage: 80,
            endpoint: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/{model}',
            imageModels: [
                "@cf/bytedance/stable-diffusion-xl-lightning",
                "@cf/black-forest-labs/flux-1-schnell"
            ],
        },
        novita: {
            name: 'Novita AI',
            key: process.env.NOVITA_API_KEY,
            models: [
                'mistralai/mistral-nemo',
                'openai/gpt-oss-20b',
                'meta-llama/llama-3.1-8b-instruct',
            ],
            rpm: 10,
            daily_limit: 300,
            priority: 10,
            heavy_usage: 72,
            endpoint: 'https://api.novita.ai/v3/openai/chat/completions'
        },

        ollama: {
            name: 'Ollama (Local)',
            host: process.env.OLLAMA_HOST || 'http://localhost:11434',
            models: ['llama3.1'], // Dynamic check later?
            rpm: 1000,
            daily_limit: 100000,
            priority: 15,
            heavy_usage: 60,
            endpoint: '{host}/v1/chat/completions'
        },
        pollinations: {
            name: 'Pollinations.ai',
            type: 'image',
            models: ['flux', 'turbo'],
            rpm: 30,
            daily_limit: 1000,
            priority: 1,
            endpoint: 'https://image.pollinations.ai/prompt/{prompt}?model={model}&nologo=true'
        }
    }
};
