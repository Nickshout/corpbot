import { NextResponse } from 'next/server';
import { generateAnswer } from '@/lib/gemini';
import { buildContext, retrieveRelevantChunks } from '@/lib/rag';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { session_id, message } = await request.json();

  if (!session_id || !message) {
    return NextResponse.json({ error: 'session_id e message são obrigatórios' }, { status: 400 });
  }

  const insertUser = await supabase.from('messages').insert([
    {
      session_id,
      role: 'user',
      content: message,
    },
  ]);

  if (insertUser.error) {
    return NextResponse.json({ error: insertUser.error.message }, { status: 500 });
  }

  const relevantChunks = await retrieveRelevantChunks(message, 5);
  const context = buildContext(relevantChunks);

  let answer: string;
  try {
    answer = await generateAnswer(context, message);
  } catch (error) {
    console.error('Erro em /api/chat:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido no Gemini' }, { status: 500 });
  }

  const insertAssistant = await supabase.from('messages').insert([
    {
      session_id,
      role: 'assistant',
      content: answer,
    },
  ]);

  if (insertAssistant.error) {
    return NextResponse.json({ error: insertAssistant.error.message }, { status: 500 });
  }

  return NextResponse.json({ answer });
}
