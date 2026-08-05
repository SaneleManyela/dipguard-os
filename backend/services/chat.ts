import { randomUUID } from 'crypto';
import { query } from './db';
import { Express } from 'express';

export interface ChatAttachment {
  id: string;
  chatId: string;
  filename: string;
  mimeType: string;
  url: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  attachments?: ChatAttachment[];
  createdAt: string;
}

export async function initChatTables(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_attachments (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function saveChatMessage(
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const id = randomUUID();
  await query(
    `INSERT INTO chat_messages (id, role, content, metadata) VALUES ($1, $2, $3, $4)`,
    [id, role, content, metadata || null]
  );
  return id;
}

export async function saveChatAttachment(
  chatId: string,
  file: Express.Multer.File
): Promise<ChatAttachment> {
  const id = randomUUID();
  await query(
    `INSERT INTO chat_attachments (id, chat_id, filename, mime_type, data) VALUES ($1, $2, $3, $4, $5)`,
    [id, chatId, file.originalname, file.mimetype, file.buffer]
  );

  return {
    id,
    chatId,
    filename: file.originalname,
    mimeType: file.mimetype,
    url: `/api/chat-attachment/${id}`,
    createdAt: new Date().toISOString()
  };
}

export async function getChatHistory(limit = 100): Promise<ChatMessage[]> {
  const result = await query(
    `SELECT m.id, m.role, m.content, m.metadata, m.created_at AS "createdAt",
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'chatId', a.chat_id,
            'filename', a.filename,
            'mimeType', a.mime_type,
            'url', '/api/chat-attachment/' || a.id,
            'createdAt', a.created_at
          )
        ) FILTER (WHERE a.id IS NOT NULL), '[]'
      ) AS attachments
      FROM chat_messages m
      LEFT JOIN chat_attachments a ON a.chat_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at ASC
      LIMIT $1;`,
    [limit]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    metadata: row.metadata || undefined,
    attachments: row.attachments.length > 0 ? row.attachments : undefined,
    createdAt: row.createdAt
  }));
}

export async function getChatAttachmentById(id: string): Promise<{
  filename: string;
  mimeType: string;
  data: Buffer;
} | null> {
  const result = await query(
    'SELECT filename, mime_type, data FROM chat_attachments WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return {
    filename: result.rows[0].filename,
    mimeType: result.rows[0].mime_type,
    data: result.rows[0].data
  };
}
