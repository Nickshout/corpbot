'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import UploadButton from './UploadButton';
import DocumentList from './DocumentList';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

function generateSessionId() {
  if (typeof window === 'undefined') return 'session-unknown';
  const existing = window.localStorage.getItem('corpbot_session_id');
  if (existing) return existing;

  const id = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  window.localStorage.setItem('corpbot_session_id', id);
  return id;
}

export default function Chat() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = generateSessionId();
    setSessionId(id);
    const savedDocs = window.localStorage.getItem('corpbot_documents');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }

    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.messages) {
          setHistory(data.messages);
        }
      })
      .catch(() => {
        setError('Não foi possível carregar o histórico da sessão.');
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, documents]);

  const lastMessage = useMemo(() => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  }, [history]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setError('');
    setLoading(true);

    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userMessage.content }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Erro ao processar a mensagem.');
        return;
      }

      const assistantMessage: ChatMessage = {
        id: data.id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Desculpe, não consegui responder no momento.',
        created_at: new Date().toISOString(),
      };

      setHistory((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (filename: string) => {
    setDocuments((current) => {
      const next = [...current, filename];
      window.localStorage.setItem('corpbot_documents', JSON.stringify(next));
      return next;
    });
  };

  return (
    <main className="min-h-screen p-6 sm:p-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">{process.env.NEXT_PUBLIC_APP_NAME || 'CorpBot'}</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Copiloto Corporativo Inteligente</h1>
              <p className="mt-3 max-w-2xl text-slate-300 sm:text-lg">
                Faça perguntas sobre políticas da empresa, onboarding, benefícios e reembolsos. Envie PDFs para que o sistema use o conteúdo como contexto.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <UploadButton onUpload={handleUploadSuccess} />
              <span className="text-sm text-slate-500">Sessão: {sessionId.slice(-8)}</span>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Chat</h2>
                <p className="text-sm text-slate-400">O histórico da conversa é salvo na nuvem e carregado por sessão.</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{history.length} mensagens</span>
            </div>

            <div className="mb-4 flex h-[420px] flex-col gap-4 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/90 p-5 scrollbar-thin">
              {history.length === 0 ? (
                <div className="mt-12 text-center text-slate-500">Nenhuma mensagem ainda. Comece perguntando algo.</div>
              ) : (
                history.map((message) => <MessageBubble key={message.id} role={message.role} content={message.content} />)
              )}
              <div ref={bottomRef} />
            </div>

            {error ? <div className="mb-4 rounded-3xl border border-red-600 bg-red-950/30 p-4 text-sm text-red-300">{error}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <textarea
                className="min-h-[120px] flex-1 resize-none rounded-3xl border border-slate-700 bg-slate-950 p-4 text-slate-100 outline-none focus:border-primary"
                placeholder="Digite sua pergunta aqui..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={4}
              />
              <button
                disabled={loading}
                onClick={handleSend}
                className="inline-flex h-14 items-center justify-center rounded-3xl bg-primary px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Pensando...' : 'Enviar pergunta'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <DocumentList documents={documents} />
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-slate-300">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Como funciona</h2>
              <ul className="space-y-3 text-sm leading-7">
                <li>1. Envie um PDF de políticas internas.</li>
                <li>2. O texto é extraído e armazenado no Supabase.</li>
                <li>3. O chat consulta documentos relevantes antes de chamar o Gemini.</li>
                <li>4. O histórico da sessão é persistido para manter o contexto.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
