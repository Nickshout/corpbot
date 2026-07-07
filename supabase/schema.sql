create extension if not exists "pgcrypto";
create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  chunk_index integer not null,
  created_at timestamp with time zone default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists document_chunks_embedding_hnsw_idx
  on document_chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function match_chunks(query_embedding vector(768), match_count int default 5)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index integer,
  similarity double precision,
  document_name text
)
language sql
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.name as document_name
  from document_chunks dc
  join documents d on d.id = dc.document_id
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
