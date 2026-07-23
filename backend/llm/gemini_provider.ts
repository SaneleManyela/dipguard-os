import { LLMProvider } from './base_provider';

export class GeminiProvider implements LLMProvider {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
    }

    async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            return "Simulated response (Gemini API Key missing): Focus on Fat Tails and Volatility Clustering.";
        }
        // Simulated Gemini API Call
        return `[Gemini 3.5 Flash] Analysis for: ${prompt}`;
    }

    async analyzeMarketEvent(ticker: string, event: string): Promise<string> {
        return this.generateResponse(`Analyze the following market event for ${ticker}: ${event}`);
    }
}
