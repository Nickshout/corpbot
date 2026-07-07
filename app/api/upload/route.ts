import pdfParse from 'pdf-parse';
import { NextResponse } from 'next/server';
import { indexDocument } from '@/lib/rag';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Arquivo inválido. Envie um PDF.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const content = parsed.text?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do PDF. Verifique se o arquivo está legível.' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({ name: file.name, content })
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Não foi possível salvar o documento.' }, { status: 500 });
    }

    try {
      await indexDocument(data.id, content);
    } catch (indexError) {
      const message = indexError instanceof Error ? indexError.message : 'Erro desconhecido ao indexar o documento.';
      console.warn('Upload salvo, mas indexação semântica falhou:', message);
      return NextResponse.json({
        success: true,
        filename: file.name,
        warning: `Documento salvo, mas a indexação semântica falhou: ${message}`,
      });
    }

    return NextResponse.json({ success: true, filename: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao processar o PDF.';
    return NextResponse.json(
      {
        error: message.includes('bad XRef entry') || message.includes('Unexpected token')
          ? 'Não foi possível ler este PDF. O arquivo pode estar corrompido ou não ser um PDF válido.'
          : `Falha ao processar o upload: ${message}`,
      },
      { status: 500 },
    );
  }
}
