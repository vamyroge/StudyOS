# Evaluation Framework

## Status: PLANNED

## RAG Evaluation
Metrics: retrieval relevance/recall/ranking, generation correctness/faithfulness/groundedness/citation correctness/hallucination.
Evaluation cases have: question, expected_sources, expected_answer, retrieved_sources, generated_answer, metrics.
No fake ground truth.

## Model Benchmark
Dimensions: accuracy, reasoning, RAG quality, groundedness, hallucination, latency, token usage, cost.
Benchmark cases are versioned.
No claiming "model X is best" without full data.

## Learning Algorithm Evaluation
Supports: pre-test → learning period → post-test → retention test.
Compare: Adaptive vs Fixed.
Every experiment tracks: algorithm_version, model_version, prompt_version, question_set_version, dataset_version.
Historical results never modified.

## Research Data Privacy
Production identity separated from research identity via pseudonymization.
Research datasets exclude email, username, unnecessary PII.
Support: data export, deletion, retention, anonymization.
