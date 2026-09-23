# STUDYOS — RAG SYSTEM

## 1. PIPELINE

```text
Source
 ↓
Ingestion
 ↓
Validation
 ↓
Chunking
 ↓
Metadata
 ↓
Embedding
 ↓
pgvector
 ↓
Hybrid Retrieval
 ↓
Reranking / Filtering
 ↓
Context Assembly
 ↓
LLM
```

---

# 2. HYBRID SEARCH

StudyOS combines:

```text
Dense Vector Search
+
Keyword Search
```

because curriculum questions may depend on both semantic similarity and exact terminology.

---

# 3. METADATA FILTERING

Retrieval should consider:

```text
grade
subject
chapter
topic
document type
source
version
status
```

---

# 4. SOURCE PROVENANCE

Every retrieved chunk should be traceable to its source document.

The AI must not invent citations.

---

# 5. INGESTION

Large documents must not depend on one long synchronous HTTP request.

Prefer:

```text
Upload
 ↓
Persist
 ↓
Background / staged processing
 ↓
Chunk
 ↓
Embed
 ↓
Index
```

---

# 6. FAILURE STATES

Handle:

```text
upload failure
parsing failure
embedding failure
vector database failure
timeout
duplicate document
invalid document
```

A failed embedding job must not corrupt the source document.
