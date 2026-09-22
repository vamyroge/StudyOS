# RAG Architecture

## Status: PLANNED

## Approach: Hybrid RAG
Semantic Search + Keyword Search + Metadata Filtering + Knowledge Graph Retrieval

## Pipeline
```
Question
→ Query understanding
→ Candidate retrieval
→ Metadata filter
→ Ranking
→ Graph context
→ Context assembly
→ LLM
```

## Provenance
Every RAG response must include: document, version, page, chunk, source.
If evidence insufficient, AI must say so. No fake citations.

## Document Processing
```
Upload → Storage → Processing Job → Extract/OCR → Classify → Deduplicate → Chunk → Embed → Moderate → Approve → Publish
```

User uploads never directly become authoritative content.

## Embedding Architecture
Interface: embed(text), embedBatch(text[]), getModel(), getDimension(), getVersion()
Store: embedding_model, embedding_dimension, embedding_version
Support re-embedding without breaking historical data.

## Evaluation Framework
Metrics: relevance, recall, ranking quality, correctness, faithfulness, groundedness, citation correctness, hallucination.
No fake ground truth.
