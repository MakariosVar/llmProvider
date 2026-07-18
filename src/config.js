import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    maxPromptTokens: parseInt(process.env.MAX_PROMPT_TOKENS) || 30000,
    maxSystemTokens: parseInt(process.env.MAX_SYSTEM_TOKENS) || 5000,
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin'
    },
    providers: {
        zai_org: {
            name: "Z.ai",
            key: process.env.ZAI_API_KEY,
            
            models: [
                'glm-4.5-Flash',
                'glm-4.7-Flash',
            ],
            rpm: 20,
            daily_limit: 1000,
            daily_token_limit: 1000000,
            priority: 1,
            heavy_usage: 92,
            endpoint: 'https://api.z.ai/api/paas/v4/chat/completions'
        },
        groq: {
            name: 'Groq',
            key: process.env.GROQ_API_KEY,
            models: [
                'llama-3.3-70b-versatile',
                'openai/gpt-oss-120b',
                'qwen/qwen3.6-27b',
                'openai/gpt-oss-20b',
                'llama-3.1-8b-instant',       
            ],
            rpm: 30,
            daily_limit: 14400,
            daily_token_limit: 1440000,
            priority: 2,
            heavy_usage: 90,
            endpoint: 'https://api.groq.com/openai/v1/chat/completions'
        },
        nvidia_nim: {
            name: 'Nvidia NIM',
            key: process.env.NVIDIA_API_KEY,
            models: [
                'minimaxai/minimax-m3',
                'nvidia/nemotron-3-super-120b-a12b',
                'nvidia/nemotron-3-ultra-550b-a55b',
                'deepseek-ai/deepseek-v4-flash',
            ],
            rpm: 40,
            daily_limit: 1000,
            daily_token_limit: 1000000,
            priority: 3,
            heavy_usage: 92,
            endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions'
        },
        cerebras: {
            name: 'Cerebras',
            key: process.env.CEREBRAS_API_KEY,
            models: [
                'gpt-oss-120b',
                'zai-glm-4.7',
            ],
            rpm: 5,
            daily_limit: 1000,
            daily_token_limit: 1000000,
            priority: 3.5,
            heavy_usage: 92,
            endpoint: 'https://api.cerebras.ai/v1/chat/completions'
        },
        mistral_ai: {
            name: 'Mistral AI',
            key: process.env.MISTRAL_API_KEY || null,
            models: ['mistral-small-latest', 'open-mistral-nemo'],
            rpm: 2,
            daily_limit: 33000000,
            daily_token_limit: 33000000,
            priority: 4,
            heavy_usage: 65,
            endpoint: 'https://api.mistral.ai/v1/chat/completions'
        },
        github: {
            name: 'GitHub Models',
            key: process.env.GITHUB_TOKEN,
            models: [
                'gpt-4o',
                'gpt-4o-mini',
            ],
            rpm: 0,
            daily_limit: 0,
            daily_token_limit: 0,
            priority: 5,
            heavy_usage: 78,
            endpoint: 'https://models.inference.ai.azure.com/chat/completions',
            headers: {
                'X-GitHub-Api-Version': '2026-03-10',
                'Accept': 'application/vnd.github+json'
            }
        },
        google_gemini: {
            name: 'Google Gemini',
            key: process.env.GEMINI_API_KEY,
            models: [
                'gemini-3.5-flash',
                'gemini-3.1-flash-lite',
            ],
            rpm: 10,
            daily_limit: 1500,
            daily_token_limit: 250000,
            priority: 6,
            heavy_usage: 95,
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
        },
        huggingface: {
            name: 'HuggingFace',
            key: process.env.HF_API_KEY,
            models: [
                'deepseek-ai/DeepSeek-V4-Flash',
                'Qwen/Qwen2.5-7B-Instruct',
            ],
            rpm: 5,
            daily_limit: 100,
            daily_token_limit: 100000,
            priority: 7,
            heavy_usage: 60,
            endpoint: 'https://router.huggingface.co/v1/chat/completions'
        },
        cohere: {
            name: 'Cohere',
            key: process.env.COHERE_API_KEY,
            models: ['command-a-plus-05-2026', 'command-a-03-2025'],
            rpm: 20,
            daily_limit: 33,
            daily_token_limit: 10000,
            priority: 8,
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
            daily_limit: 50,
            daily_token_limit: 50000,
            priority: 9,
            heavy_usage: 70,
            endpoint: 'https://openrouter.ai/api/v1/chat/completions'
        },
        cloudflare: {
            name: 'Cloudflare Workers AI',
            key: process.env.CLOUDFLARE_TOKEN,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            models: [
                "@cf/meta/llama-4-scout-17b-16e-instruct",
                "@cf/moonshotai/kimi-k2.6",
                "@cf/moonshotai/kimi-k2.7-code",
                "@cf/google/gemma-4-26b-a4b-it",
            ],
            rpm: 30,
            daily_limit: 10000,
            daily_token_limit: 10000,
            priority: 10,
            heavy_usage: 80,
            endpoint: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/{model}',
            imageModels: [
                "@cf/bytedance/stable-diffusion-xl-lightning",
                "@cf/black-forest-labs/flux-1-schnell",
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
            rpm: 0,
            daily_limit: 0,
            daily_token_limit: 0,
            priority: 11,
            heavy_usage: 72,
            endpoint: 'https://api.novita.ai/v3/openai/chat/completions'
        },
        ollama: {
            name: 'Ollama (Local)',
            host: process.env.OLLAMA_HOST || 'http://localhost:11434',
            models: ['llama3.1'],
            rpm: 1000,
            daily_limit: 100000,
            daily_token_limit: 100000000,
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
            daily_token_limit: 10000,
            priority: 1,
            endpoint: 'https://image.pollinations.ai/prompt/{prompt}?model={model}&nologo=true'
        }
    }
};
