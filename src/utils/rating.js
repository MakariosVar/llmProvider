export function calculateRating(model) {
    let score = 0.0;

    // 1. Context Window (0.0 - 3.0 pts)
    const context = model.context_length || 4096;
    if (context >= 200000) score += 3.0;
    else if (context >= 128000) score += 2.0;
    else if (context >= 32000) score += 1.0;
    else if (context >= 8000) score += 0.5;

    // 2. Feature Support (0.0 - 3.0 pts)
    if (model.supported_parameters) {
        if (model.supported_parameters.includes('tools')) score += 1.0;
        if (model.supported_parameters.includes('structured_outputs')) score += 1.0;
        if (model.supported_parameters.includes('reasoning')) score += 1.0;
    }

    // 3. Architecture/Parameters (heuristic, 0.0 - 3.0 pts)
    const name = (model.name || '').toLowerCase();
    // More specific keywords for higher points
    if (name.includes('ultra') || name.includes('pro-max') || name.includes('opus')) score += 3.0;
    else if (name.includes('pro') || name.includes('max') || name.includes('sonnet')) score += 2.0;
    else if (name.includes('flash') || name.includes('turbo') || name.includes('haiku')) score += 1.0;
    
    // 4. Penalty for free models (free models often have lower rate limits/priority)
    if (model.name && model.name.toLowerCase().includes(':free')) score -= 2.0;

    // Normalize and clamp to 0-10
    const finalScore = Math.min(10, Math.max(0, score)); 
    return finalScore.toFixed(1);
}
