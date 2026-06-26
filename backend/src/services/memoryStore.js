import db from '../db/connection.js';
import { embedTexts, toPgVector } from './embeddings.js';

/**
 * Store a new memory. Embeds the content first.
 */
export async function saveMemory({ userId, content, source = 'explicit' }) {
  const cleaned = content.trim();
  if (!cleaned) return null;

  // De-dupe: if a near-identical memory already exists, skip
  const existing = await db.prepare(`
    SELECT id FROM memories WHERE user_id = ? AND LOWER(content) = LOWER(?)
  `).get(userId, cleaned);
  if (existing) return existing.id;

  const [embedding] = await embedTexts([cleaned], { inputType: 'search_document' });
  const vec = toPgVector(embedding);

  const res = await db.query(`
    INSERT INTO memories (user_id, content, source, embedding)
    VALUES ($1, $2, $3, $4::vector) RETURNING id
  `, [userId, cleaned, source, vec]);

  return res.rows[0].id;
}

/**
 * Retrieve top-K relevant memories for a query.
 */
export async function searchMemories({ userId, query, limit = 5 }) {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const [embedding] = await embedTexts([cleaned], { inputType: 'search_query' });
  const vec = toPgVector(embedding);

  const rows = await db.query(`
    SELECT id, content, source, created_at,
           1 - (embedding <=> $1::vector) AS similarity
    FROM memories
    WHERE user_id = $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `, [vec, userId, limit]);

  // Mark these memories as "used" so we know they're being applied
  if (rows.rows.length > 0) {
    const ids = rows.rows.map(r => r.id);
    await db.query(
      `UPDATE memories SET last_used_at = NOW() WHERE id = ANY($1::int[])`,
      [ids]
    );
  }

  // Filter weak matches (similarity < 0.3 = noise)
  return rows.rows.filter(r => r.similarity > 0.3);
}

/**
 * List all memories for a user.
 */
export async function listMemories(userId) {
  const rows = await db.prepare(`
    SELECT id, content, source, created_at, last_used_at
    FROM memories WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 100
  `).all(userId);
  return rows;
}

/**
 * Delete a memory.
 */
export async function deleteMemory(userId, id) {
  await db.query(`DELETE FROM memories WHERE id = $1 AND user_id = $2`, [id, userId]);
}