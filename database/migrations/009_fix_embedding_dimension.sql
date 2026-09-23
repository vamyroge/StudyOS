-- Fix embedding dimension mismatch: align to 1024 as per .env.example

alter table document_embeddings alter column embedding type vector(1024);
