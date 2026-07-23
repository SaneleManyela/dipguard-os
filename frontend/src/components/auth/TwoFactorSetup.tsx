import React, { useState } from 'react';
import { generate2FA, verify2FA } from '../../services/api';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';

export function TwoFactorSetup() {
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');

    const handleGenerate = async () => {
        try {
            const res = await generate2FA();
            setQrCodeUrl(res.qrCodeUrl);
            setSecret(res.secret);
            setMessage('Scan the QR code with your Authenticator App.');
        } catch (error) {
            setMessage('Failed to generate 2FA secret.');
        }
    };

    const handleVerify = async () => {
        if (token.length !== 6) return;
        try {
            const res = await verify2FA(token);
            if (res.success) {
                setMessage('2FA Successfully Enabled!');
            } else {
                setMessage('Invalid token. Try again.');
            }
        } catch (error) {
            setMessage('Verification failed.');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', background: '#1a1a1a', color: '#fff', borderRadius: '12px' }}>
            <h2>Two-Factor Authentication</h2>
            
            {!qrCodeUrl ? (
                <button onClick={handleGenerate} style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Setup 2FA
                </button>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <img src={qrCodeUrl} alt="2FA QR Code" style={{ border: '4px solid white', borderRadius: '8px' }} />
                    <p style={{ fontSize: '0.9rem', color: '#888' }}>Secret: {secret}</p>
                    
                    <div>
                        <InputOTP maxLength={6} value={token} onChange={setToken}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <button onClick={handleVerify} disabled={token.length !== 6} style={{ padding: '10px 20px', background: token.length === 6 ? '#0070f3' : '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
                        Verify & Enable
                    </button>
                </div>
            )}
            
            {message && <p style={{ marginTop: '1rem', color: '#00df89', textAlign: 'center' }}>{message}</p>}
        </div>
    );
}
