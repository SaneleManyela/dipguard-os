import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    // In Layer 4, if this was a production app, we would verify a JWT via Firebase/Supabase
    // For now, we enforce that a Bearer token exists and is valid
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing Bearer Token" });
    }

    const token = authHeader.split(' ')[1];
    
    // Stub validation (e.g. comparing against a mock token or decoding JWT)
    if (token !== "dipguard-mock-token-123") {
        return res.status(403).json({ success: false, error: "Forbidden: Invalid Token" });
    }

    next();
};
