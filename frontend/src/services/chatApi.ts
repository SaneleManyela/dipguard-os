const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer dipguard-mock-token-123'
});

export async function fetchChatHistory() {
  const response = await fetch(`${API_BASE_URL}/chat-history`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }
  return response.json();
}

export async function sendChatMessage(message: string) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message })
  });
  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }
  return response.json();
}

export async function uploadChatAttachment(chatId: string, file: File) {
  const body = new FormData();
  body.append('chatId', chatId);
  body.append('attachment', file);

  const response = await fetch(`${API_BASE_URL}/chat-attachment`, {
    method: 'POST',
    body,
  });
  if (!response.ok) {
    throw new Error('Failed to upload chat attachment');
  }
  return response.json();
}
