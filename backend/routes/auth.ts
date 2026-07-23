import { Router } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { requireAuth } from '../middleware/auth';

const router = Router();

// In a real application, these secrets would be stored securely in the database
// associated with each user ID. For this demonstration, we use in-memory storage.
const mockUserStore: Record<string, { secret?: speakeasy.GeneratedSecret, is2FAEnabled: boolean }> = {
    'user-123': { is2FAEnabled: false }
};

// 1. Generate 2FA Secret and QR Code
router.post('/2fa/generate', requireAuth, async (req, res) => {
    try {
        const userId = 'user-123'; // Mock user ID (extracted from token in real app)
        
        // Generate a new secret
        const secret = speakeasy.generateSecret({
            name: 'DipGuard OS'
        });
        
        // Store it temporarily
        mockUserStore[userId] = { ...mockUserStore[userId], secret };
        
        if (secret.otpauth_url) {
            // Generate QR code data URL
            const dataUrl = await qrcode.toDataURL(secret.otpauth_url);
            
            res.json({
                success: true,
                secret: secret.base32,
                qrCodeUrl: dataUrl
            });
        } else {
            res.status(500).json({ success: false, error: 'Failed to generate OTP url' });
        }
    } catch (error) {
        console.error('2FA Generation Error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate 2FA' });
    }
});

// 2. Verify and Enable 2FA
router.post('/2fa/verify', requireAuth, (req, res) => {
    try {
        const { token } = req.body;
        const userId = 'user-123';
        
        const user = mockUserStore[userId];
        
        if (!user || !user.secret) {
            return res.status(400).json({ success: false, error: '2FA setup not initiated' });
        }
        
        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.secret.base32,
            encoding: 'base32',
            token: token,
            window: 1 // Allow 1 step (30 seconds) before or after
        });
        
        if (verified) {
            // Mark 2FA as permanently enabled
            mockUserStore[userId].is2FAEnabled = true;
            res.json({ success: true, message: '2FA successfully verified and enabled' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid 2FA token' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

export default router;
