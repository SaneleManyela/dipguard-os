import { Request, Response, NextFunction } from 'express';

// Simple memory cache stub for demonstration
// In production, connect this to Redis/Upstash (Layer 10)
const cacheStore: Record<string, { value: any, expiry: number }> = {};

export const cacheMiddleware = (durationSeconds: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const key = '__express__' + req.originalUrl || req.url;
        
        const cached = cacheStore[key];
        if (cached && cached.expiry > Date.now()) {
            console.log(`[Cache] HIT for ${key}`);
            return res.json(cached.value);
        }

        console.log(`[Cache] MISS for ${key}`);
        
        // Override res.json to cache the response body
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            cacheStore[key] = {
                value: body,
                expiry: Date.now() + (durationSeconds * 1000)
            };
            return originalJson(body);
        };
        
        next();
    };
};
