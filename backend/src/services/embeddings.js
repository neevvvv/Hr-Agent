const COHERE_URL = 'https://api.cohere.com/v2/embed';

/**
 * Get embeddings for one or more strings via Cohere.
 * Returns an array of float arrays (vectors), same length as inputs.
 */
export async function embedTexts(texts, { inputType = 'search_document' } = {}) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error('COHERE_API_KEY missing');
  if (!texts?.length) return [];

  const model = process.env.COHERE_EMBED_MODEL || 'embed-english-light-v3.0';

  const res = await fetch(COHERE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      texts,
      input_type: inputType,     // 'search_document' or 'search_query'
      embedding_types: ['float'],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cohere embed failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.embeddings?.float ?? [];
}

/**
 * Format a JS number[] as a Postgres pgvector literal string: '[0.1,0.2,...]'
 */
export function toPgVector(arr) {
  return `[${arr.join(',')}]`;
}