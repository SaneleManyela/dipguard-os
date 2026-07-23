export interface LLMProvider {
    generateResponse(prompt: string): Promise<string>;
    analyzeMarketEvent(ticker: string, event: string): Promise<string>;
}
