import { generateAnswer } from './gemini';
import { supabase } from './supabase';

export type RetrievedChunk = {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  similarity: number;
  document_name: string;
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export function chunkText(text: string, chunkSize = 500, overlap = 50) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const safeChunkSize = Math.max(50, chunkSize);
  const safeOverlap = Math.min(Math.max(0, overlap), safeChunkSize - 1);
  const step = safeChunkSize - safeOverlap;
  const words = normalized.split(' ');

  if (words.length <= safeChunkSize) {
    return [normalized];
  }

  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += step) {
    const end = start + safeChunkSize;
    const slice = words.slice(start, end).join(' ');
    if (!slice.trim()) {
      continue;
    }

    chunks.push(slice.trim());
    if (end >= words.length) {
      break;
    }
  }

  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não encontrada.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: {
          parts: [{ text }],
        },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Erro ao gerar embedding: ${message}`);
  }

  const data = await response.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Embedding retornado pelo Gemini está vazio.');
  }

  return values.map((value: unknown) => Number(value));
}

export async function indexDocument(documentId: string, content: string) {
  const chunks = chunkText(content);
  if (chunks.length === 0) {
    return 0;
  }

  const rows = [] as Array<{
    document_id: string;
    content: string;
    embedding: number[];
    chunk_index: number;
  }>;

  for (const [index, chunk] of chunks.entries()) {
    const embedding = await generateEmbedding(chunk);
    rows.push({
      document_id: documentId,
      content: chunk,
      embedding,
      chunk_index: index,
    });
  }

  const { error } = await supabase.from('document_chunks').insert(rows);
  if (error) {
    throw new Error(error.message);
  }

  console.log(`${rows.length} chunks indexados com sucesso para o documento ${documentId}`);
  return rows.length;
}

export async function retrieveRelevantChunks(query: string, topK = 5) {
  const embedding = await generateEmbedding(query);
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_count: topK,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RetrievedChunk[];
}

export function buildContext(chunks: RetrievedChunk[]) {
  if (!chunks.length) {
    return 'Nenhum documento relevante encontrado.';
  }

  return chunks
    .map((chunk, index) => {
      const similarity = (chunk.similarity * 100).toFixed(1);
      return `[Documento ${index + 1}: ${chunk.document_name}] Similaridade: ${similarity}%\n${chunk.content.trim()}`;
    })
    .join('\n\n---\n\n');
}

export async function buildAnswerWithContext(question: string, documents: Array<{ id: string; name?: string; content: string }>) {
  void documents;
  const relevantChunks = await retrieveRelevantChunks(question, 5);
  const context = buildContext(relevantChunks);
  return generateAnswer(context, question);
}
