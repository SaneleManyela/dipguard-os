const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dipguard-mock-token-123'
    };
};

export const scanTicker = async (ticker: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ticker })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to scan ticker:", error);
        throw error;
    }
};

export const generate2FA = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/2fa/generate`, {
        method: 'POST',
        headers: getHeaders()
    });
    return response.json();
};

export const verify2FA = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ token })
    });
    return response.json();
};
