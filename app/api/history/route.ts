import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { session_id } = await request.json();

  if (!session_id) {
    return NextResponse.json({ error: 'session_id é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id,role,content,created_at')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
