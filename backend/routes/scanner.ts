import { Router } from 'express';
import { z } from 'zod';
import { runQuantAgent } from '../services/quant_orchestrator';
import { ReplicateProvider } from '../llm/replicate_provider';
import { requireAuth } from '../middleware/auth';
import { cacheMiddleware } from '../services/cache';

const router = Router();
const llm = new ReplicateProvider();

// SEC-01: Zod Input Validation Schema
const ScanRequestSchema = z.object({
    ticker: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/)
});

// SEC-02: Require Auth Middleware (Layer 4)
// Layer 10: Cache the scan results for 60 seconds (since market data doesn't change every ms)
router.post('/scan', requireAuth, cacheMiddleware(60), async (req, res) => {
    try {
        const parseResult = ScanRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ success: false, error: "Invalid payload parameters" });
        }
        
        const { ticker } = parseResult.data;
        
        // 1. Run Market Intelligence
        const marketData = await runQuantAgent('market_intelligence', { ticker });
        
        // 2. Run Alert Engine
        const alertData = await runQuantAgent('alert_engine', { marketData });
        
        // 3. Ask LLM for Narrative Analysis
        const analysis = await llm.analyzeMarketEvent(ticker || "Global", "Major selloff");
        
        res.json({
            success: true,
            scanResult: {
                marketData,
                alertData,
                narrative: analysis
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Scan failed" });
    }
});

export default router;
