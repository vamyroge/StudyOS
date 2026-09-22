# Learning Engine

## Status: PLANNED

## Components

### Knowledge Tracing
Estimate mastery per concept based on attempts.
Input: question, concept, answer, difficulty, attempt history, response time.
Output: concept mastery score.
MVP: Bayesian Knowledge Tracing (interpretable). Future: DKT, AKT.
All mastery scores traceable to input data.

### Error Analysis
Error types: concept_gap, calculation_error, formula_misuse, misunderstanding, reasoning_error, reading_error, careless_error, unknown.
AI cannot assert misconception with low confidence as fact.

### Adaptive Learning
Student State + Knowledge State + Goals + Recent Performance → Next Best Action.
Actions: learn_concept, review_concept, easy/medium/hard_question, retry_mistake, diagnostic_test, spaced_review.
Every recommendation has: reason, evidence, confidence.

### Spaced Review
Track: concept, last_review, next_review, interval, difficulty, review_result.
MVP: simple interpretable algorithm. Extensible later.

### Raw vs Derived Data
RAW (immutable): attempts, answers, response_time, study_sessions.
DERIVED (computed): mastery, weakness, error_classification, recommendation.
Pipeline: RAW EVENT → ANALYSIS → DERIVED STATE.
Never modify raw events to improve results.
