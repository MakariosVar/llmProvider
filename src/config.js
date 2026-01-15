import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    agentUrl: process.env.AGENT_URL || 'http://localhost:3001',
    providers: {
        google_gemini: {
            name: 'Google Gemini',
            key: process.env.GEMINI_API_KEY,
            models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'],
            rpm: 60,  // Updated for 2.5 Flash
            daily_limit: 2000,  // Conservative estimate
            priority: 1,
            heavy_usage: 95,
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
        },
        groq: {
            name: 'Groq',
            key: process.env.GROQ_API_KEY,
            models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'meta-llama/llama-guard-4-12b', 'openai/gpt-oss-20b'],
            rpm: 60,
            daily_limit: 2000,
            priority: 2,
            heavy_usage: 90,
            endpoint: 'https://api.groq.com/openai/v1/chat/completions'
        },
        cerebras: {
            name: 'Cerebras',
            key: process.env.CEREBRAS_API_KEY,
            models: ['llama-3.3-70b', 'llama3.1-8b'],
            rpm: 30,
            daily_limit: 14400,
            priority: 3,
            heavy_usage: 88,
            endpoint: 'https://api.cerebras.ai/v1/chat/completions'
        },
        cloudflare: {
            name: 'Cloudflare Workers AI',
            key: process.env.CLOUDFLARE_TOKEN,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            models: [
                // High-end models
                "@cf/qwen/qwen2.5-coder-32b-instruct",
                "@cf/qwen/qwq-32b",
                "@cf/meta/llama-3.1-70b-instruct-fp8-fast",

                // Strong mid-tier models
                "@cf/mistralai/mistral-small-3.1-24b-instruct",
                "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
                "@cf/google/gemma-3-12b-it",
                "@cf/qwen/qwen3-30b-a3b-fp8",

                // Mid-tier but still useful Llama
                "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
                "@cf/meta/llama-3.1-8b-instruct-fp8",
                "@cf/meta/llama-3.1-8b-instruct-awq"
            ],

            rpm: 30,
            daily_limit: 10000,
            priority: 4,
            heavy_usage: 80,
            endpoint: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/{model}'
        },
        github: {
            name: 'GitHub Models',
            key: process.env.GITHUB_TOKEN,
            models: ['gpt-4o-mini', 'Phi-4', 'Llama-3.3-70B-Instruct'],
            rpm: 15,
            daily_limit: 1000,
            priority: 5,
            heavy_usage: 78,
            endpoint: 'https://models.inference.ai.azure.com/chat/completions'
        },
        cohere: {
            name: 'Cohere',
            key: process.env.COHERE_API_KEY,
            models: ['command-r-08-2024', 'command-r-plus-08-2024'],
            rpm: 20,
            daily_limit: 1000,
            priority: 6,
            heavy_usage: 72,
            endpoint: 'https://api.cohere.ai/v2/chat'
        },
        huggingface: {
            name: 'HuggingFace',
            key: process.env.HF_API_KEY,
            models: ['meta-llama/Meta-Llama-3-8B-Instruct'],
            rpm: 5,
            daily_limit: 30,
            priority: 7,
            heavy_usage: 60,
            endpoint: 'https://router.huggingface.co/v1/chat/completions'
        },
        nvidia: {
            name: 'NVIDIA NIM',
            key: process.env.NVIDIA_API_KEY,
            models: ['meta/llama-3.1-405b-instruct'],
            rpm: 2,
            daily_limit: 100, // Unknown, conservative
            priority: 8,
            heavy_usage: 50,
            endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions'
        },
        openrouter: {
            name: 'OpenRouter',
            key: process.env.OPENROUTER_API_KEY,
            models: [
                'mistralai/mistral-7b-instruct:free',
                'x-ai/grok-4.1-fast:free',
                'google/gemini-2.0-flash-exp:free',
                'kwaipilot/kat-coder-pro:free',
                'openrouter/bert-nebulon-alpha'
            ],
            rpm: 20,
            daily_limit: 200,
            priority: 9,
            heavy_usage: 70,
            endpoint: 'https://openrouter.ai/api/v1/chat/completions'
        },
        nlpcloud: {
            name: 'NLP Cloud',
            key: process.env.NLP_CLOUD_API_KEY,
            models: ['chatdolphin', 'finetuned-llama-3-70b'],
            rpm: 3,
            daily_limit: 100,
            priority: 10,
            heavy_usage: 68,
            endpoint: 'https://api.nlpcloud.io/v1/gpu/chatdolphin/generation'
        },
        apifreellm: {
            name: 'APIFreeLLM',
            key: null,
            models: ['default'],
            rpm: 12,
            daily_limit: 1000,
            priority: 11,
            heavy_usage: 75,
            endpoint: 'https://apifreellm.com/api/chat'
        },
        novita: {
            name: 'Novita AI',
            key: process.env.NOVITA_API_KEY,
            models: [
                'qwen/qwen3-8b-fp8',
                'mistralai/mistral-nemo',
                'openai/gpt-oss-20b',
                'meta-llama/llama-3.1-8b-instruct',
                'meta-llama/llama-3.2-3b-instruct',
                'qwen/qwen3-4b-fp8'
            ],
            rpm: 10,
            daily_limit: 300,
            priority: 12,
            heavy_usage: 72,
            endpoint: 'https://api.novita.ai/v3/openai/chat/completions'
        },

        ai21labs: {
            name: 'AI21 Labs',
            key: process.env.AI21_API_KEY || null,
            models: ['jamba-large', 'jamba-mini'],
            rpm: 10,
            daily_limit: 500,
            priority: 13,
            heavy_usage: 70,
            endpoint: 'https://api.ai21.com/studio/v1/chat/completions'
        },
        mistral_ai: {
            name: 'Mistral AI (free-tier)',
            key: process.env.MISTRAL_API_KEY || null,
            models: ['mistral-small-latest', 'open-mistral-nemo'],
            rpm: 5,
            daily_limit: 100,
            priority: 14,
            heavy_usage: 65,
            endpoint: 'https://api.mistral.ai/v1/chat/completions'
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
        }
    }
};
