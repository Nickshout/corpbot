import { useState } from 'react';

type UploadButtonProps = {
  onUpload: (filename: string) => void;
};

type UploadStatus = {
  type: 'idle' | 'success' | 'error';
  message: string;
};

export default function UploadButton({ onUpload }: UploadButtonProps) {
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });

  return (
    <div className="flex flex-col items-start gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={async (event) => {
            const input = event.currentTarget as HTMLInputElement | null;
            const file = event.target.files?.[0];
            if (!file || !input) return;

            setStatus({ type: 'idle', message: 'Enviando PDF...' });
            const formData = new FormData();
            formData.append('pdf', file);

            try {
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              const payload = await response.json().catch(() => ({}));

              if (response.ok) {
                const message = payload?.warning
                  ? `${payload.warning}`
                  : `Upload concluído: ${payload.filename ?? file.name}`;
                setStatus({ type: payload?.warning ? 'error' : 'success', message });
                onUpload(payload.filename ?? file.name);
              } else {
                setStatus({ type: 'error', message: payload?.error || 'Falha ao enviar PDF. Tente novamente.' });
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Falha inesperada ao enviar PDF.';
              setStatus({ type: 'error', message });
            } finally {
              input.value = '';
            }
          }}
        />
        Enviar PDF
      </label>

      {status.message ? (
        <p className={`text-sm ${status.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
