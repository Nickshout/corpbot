export async function generateAnswer(context: string, question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Você é um assistente corporativo. Responda apenas com base nos documentos abaixo. Se não encontrar a informação, diga que não está disponível na base de conhecimento. Cite sempre o documento de origem.\n\nDOCUMENTOS:\n${context}\n\nPERGUNTA: ${question}`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Erro Gemini: ${JSON.stringify(data.error)}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não foi possível gerar resposta.';
}
