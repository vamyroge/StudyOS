# STUDYOS — LEARNING ENGINE

## 1. PURPOSE

The Learning Engine converts student interactions into measurable learning state.

It is one of the main differences between StudyOS and a generic AI chatbot.

---

# 2. LEARNING EVENT

Examples:

```text
question_answered
quiz_started
quiz_completed
answer_correct
answer_wrong
hint_requested
solution_viewed
topic_completed
study_session_completed
```

---

# 3. MASTERY LOOP

```text
Student Action
 ↓
Learning Event
 ↓
Evaluation
 ↓
Error Analysis
 ↓
Mastery Update
 ↓
Recommendation
```

---

# 4. ERROR CLASSIFICATION

Possible categories:

```text
conceptual
calculation
careless
misread
procedure
memory
unknown
```

The classification should remain explainable.

---

# 5. RECOMMENDATION

Recommendations may include:

```text
review concept
watch/read explanation
practice easier problem
practice same difficulty
practice harder problem
take diagnostic quiz
move to next topic
```

---

# 6. ADAPTATION

The system may adjust:

```text
difficulty
hint frequency
explanation depth
practice quantity
review frequency
```

based on observed learning state.

Do not make unsupported psychological claims about the student.

---

# 7. MODEL EVOLUTION

Start with a simple deterministic mastery model.

Only introduce sophisticated knowledge-tracing algorithms when the simpler model is validated.
