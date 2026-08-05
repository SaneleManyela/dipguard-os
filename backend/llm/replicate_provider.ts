import { LLMProvider } from './base_provider';

const DEFAULT_REPLICATE_MODEL = 'ibm/granite-3.1-8b-instruct';
const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ReplicateProvider implements LLMProvider {
    private apiToken: string;
    private modelSlug: string;

    constructor() {
        this.apiToken = process.env.REPLICATE_API_TOKEN || '';
        this.modelSlug = process.env.REPLICATE_MODEL || DEFAULT_REPLICATE_MODEL;
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Token ${this.apiToken}`,
        };
    }

    private async assertConfigured() {
        if (!this.apiToken) {
            throw new Error('Replicate API token missing. Set REPLICATE_API_TOKEN.');
        }
    }

    private async getModelVersion(): Promise<string> {
        const response = await fetch(`${REPLICATE_API_BASE}/models/${encodeURIComponent(this.modelSlug)}`, {
            headers: this.headers,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Replicate model lookup failed: ${response.status} ${errorBody}`);
        }

        const modelData = await response.json();
        const version = modelData.default_version || modelData.latest_version || modelData.versions?.[0]?.id;
        if (!version) {
            throw new Error('Unable to determine Replicate model version from model metadata.');
        }
        return version;
    }

    private async waitForPrediction(predictionId: string): Promise<any> {
        const url = `${REPLICATE_API_BASE}/predictions/${predictionId}`;
        while (true) {
            const response = await fetch(url, { headers: this.headers });
            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Replicate prediction status failed: ${response.status} ${body}`);
            }

            const data = await response.json();
            if (data.status === 'succeeded') {
                return data;
            }
            if (['failed', 'canceled', 'error'].includes(data.status)) {
                throw new Error(`Replicate prediction ${data.status}: ${JSON.stringify(data.error || data.output)}`);
            }
            await sleep(1000);
        }
    }

    async generateResponse(prompt: string): Promise<string> {
        await this.assertConfigured();

        const versionId = await this.getModelVersion();
        const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                version: versionId,
                input: {
                    prompt,
                },
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Replicate prediction create failed: ${response.status} ${body}`);
        }

        const prediction = await response.json();
        const result = await this.waitForPrediction(prediction.id);
        if (!result.output) {
            throw new Error('Replicate prediction succeeded but returned no output.');
        }

        if (Array.isArray(result.output)) {
            return result.output.map((item) => String(item)).join('\n');
        }
        return String(result.output);
    }

    async analyzeMarketEvent(ticker: string, event: string): Promise<string> {
        return this.generateResponse(`Analyze the following market event for ${ticker}: ${event}`);
    }
}
