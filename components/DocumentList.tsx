type DocumentListProps = {
  documents: string[];
};

export default function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-400">
        Nenhum documento enviado nesta sessão.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        Documentos enviados
      </h2>
      <ul className="space-y-2 text-slate-200">
        {documents.map((filename) => (
          <li key={filename} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 shadow-sm">
            {filename}
          </li>
        ))}
      </ul>
    </div>
  );
}
