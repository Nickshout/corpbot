# CorpBot — Copiloto Corporativo Inteligente

Assistente corporativo com IA desenvolvido como projeto final da disciplina "IA Generativa Aplicada ao Desenvolvimento" (UniFECAF). Permite que colaboradores façam perguntas em linguagem natural sobre documentos internos da empresa e recebam respostas contextualizadas com citação da fonte.

## Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL + pgvector)
- **Google Gemini 2.5 Flash** (geração de respostas)
- **Google Gemini Embedding 001** (embeddings semânticos — 768 dimensões)
- **pdf-parse** (extração de texto de PDFs)

## Ferramentas de IA utilizadas no desenvolvimento

- **Claude Code** — arquitetura, geração de código, debugging e refatoração
- **Google AI Studio** — testes de modelos e geração de API key

## Como funciona

1. Colaborador envia um PDF pelo chat
2. Texto é extraído e dividido em chunks de ~500 caracteres com sobreposição
3. Cada chunk é convertido em embedding vetorial via `gemini-embedding-001`
4. Embeddings são armazenados no Supabase com extensão pgvector
5. Ao receber uma pergunta, o sistema busca os chunks mais relevantes por similaridade de cosseno
6. Chunks relevantes são enviados como contexto para o `gemini-2.5-flash`
7. Resposta é exibida com citação do documento de origem
8. Histórico da conversa é persistido no Supabase por sessão

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (plano free)
- Chave de API do [Google AI Studio](https://aistudio.google.com) (gratuito)

## Configuração do Supabase

### 1. Crie um projeto
- Acesse [supabase.com](https://supabase.com) e crie um novo projeto
- Região recomendada: South America (São Paulo)

### 2. Habilite a extensão pgvector
- Acesse: **Database → Extensions**
- Busque por `vector` e habilite

### 3. Execute o schema
- Acesse: **SQL Editor**
- Execute o arquivo `supabase/schema.sql` disponível neste repositório

O schema cria:
- Tabela `documents` — armazena nome e conteúdo dos PDFs enviados
- Tabela `document_chunks` — armazena os chunks de texto com embeddings vetoriais (768 dimensões)
- Tabela `messages` — armazena o histórico de conversa por sessão
- Índice HNSW na coluna `embedding` para busca semântica eficiente
- Função `match_chunks` — busca os chunks mais relevantes por similaridade de cosseno

### 4. Copie as credenciais
- Acesse: **Settings → API → Legacy anon, service_role API keys**
- Copie a **Project URL** e a chave **anon public**

## Configuração do Google Gemini

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em **Get API key → Create API key**
3. Copie a chave gerada (começa com `AIza...`)

## Instalação

```bash
git clone https://github.com/Nickshout/corpbot.git
cd corpbot
npm install
cp .env.local.example .env.local
# Edite .env.local com suas credenciais
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
GEMINI_API_KEY=sua-gemini-api-key-aqui
NEXT_PUBLIC_APP_NAME=CorpBot
```

## Uso

1. Clique em **Enviar PDF** e faça upload de um documento interno
2. Aguarde a confirmação de indexação
3. Digite sua pergunta no chat
4. O CorpBot responde com base nos documentos enviados, citando a fonte

## Estrutura do projeto
corpbot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Endpoint de chat com RAG semântico
│   │   ├── upload/route.ts     # Endpoint de upload e indexação
│   │   └── history/route.ts    # Histórico de conversa por sessão
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Chat.tsx                # Interface principal de chat
│   ├── DocumentList.tsx        # Lista de documentos enviados
│   ├── MessageBubble.tsx       # Componente de mensagem
│   └── UploadButton.tsx        # Upload de PDF
├── lib/
│   ├── gemini.ts               # Geração de respostas via Gemini
│   ├── rag.ts                  # Chunking, embeddings e busca semântica
│   └── supabase.ts             # Cliente Supabase
├── supabase/
│   └── schema.sql              # Schema com pgvector
└── .env.local.example

## Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em **Add New → Project**
3. Importe o repositório `Nickshout/corpbot`
4. Em **Environment Variables**, adicione as 4 variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_NAME` = `CorpBot`
5. Clique em **Deploy**

> A URL pública será gerada automaticamente pela Vercel após o deploy.

## Prints

<!-- Adicione prints da aplicação após o deploy -->

## Licença

MIT
