import { encode } from 'gpt-tokenizer';

/**
 * Calculates the number of tokens for a given text string.
 * @param {string} text - The text to tokenize.
 * @returns {number} - The number of tokens.
 */
export function countTokens(text) {
    if (!text) return 0;
    return encode(text).length;
}
