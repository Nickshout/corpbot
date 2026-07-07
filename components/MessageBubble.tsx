type MessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
};

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`max-w-[85%] ${isUser ? 'ml-auto bg-slate-800 text-slate-100' : 'mr-auto bg-slate-900 text-slate-200'} rounded-2xl p-4 shadow-sm border border-slate-700`}> 
      <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">
        {isUser ? 'Você' : 'CorpBot'}
      </div>
      <p className="whitespace-pre-line leading-7 text-slate-100">{content}</p>
    </div>
  );
}
