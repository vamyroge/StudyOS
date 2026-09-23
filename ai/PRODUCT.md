# STUDYOS — PRODUCT DEFINITION

## 1. PRODUCT

**StudyOS** is an AI-Native Adaptive Learning Operating System for Vietnamese high-school students.

The system combines:

* AI tutoring
* curriculum knowledge
* quizzes
* learning history
* mastery tracking
* weakness diagnostics
* personalized recommendations
* knowledge management
* research telemetry

into one student workspace.

---

# 2. PRODUCT PHILOSOPHY

StudyOS is:

> **An adaptive learning system, not an AI chatbot.**

The AI should understand:

```text
Who is the student?
What are they learning?
What do they already know?
What mistakes do they repeatedly make?
What should they learn next?
```

The system should therefore transform:

```text
Question
```

into:

```text
Understanding
→ Practice
→ Evaluation
→ Mastery Update
→ Recommendation
```

---

# 3. TARGET USER

Primary:

```text
Vietnamese THPT students
Grades 10–12
```

Initial platform model:

```text
Students
+
StudyOS Admin / Maintainer
```

There is no requirement for a traditional teacher-management system in the initial version.

---

# 4. CORE MODULES

```text
StudyOS
│
├── Dashboard
├── AI Tutor
├── Quiz / Questions
├── Learning Progress
├── Knowledge Base
├── Student Profile
├── Admin / Moderation
├── Research / Experiments
├── Authentication
└── AI Infrastructure
```

---

# 5. DASHBOARD

The dashboard should answer:

```text
What should I study today?
What am I weak at?
What have I completed?
What should I practice next?
```

Potential information:

* recent activity
* mastery overview
* recommended topics
* pending practice
* recent mistakes
* learning streak
* progress toward goals

---

# 6. AI TUTOR

The tutor is not a generic chatbot.

It should support:

* explanation
* guided learning
* hints
* step-by-step solving
* misconception detection
* source-backed answers
* follow-up questions
* personalized difficulty

The AI should adapt to:

```text
student level
subject
topic
mastery
recent errors
learning preference
requested assistance level
```

---

# 7. QUIZ SYSTEM

Supported question types:

```text
Multiple Choice
True / False
Short Answer
Fill in the Blank
Step-by-Step Problem
```

Quiz generation and quiz rendering are separate responsibilities.

```text
AI / Question Bank
        ↓
Quiz Engine
        ↓
Question Schema
        ↓
Native UI
        ↓
Attempt
        ↓
Evaluation
        ↓
Mastery Update
```

---

# 8. KNOWLEDGE BASE

Knowledge can originate from:

* curriculum materials
* textbooks
* study documents
* exercises
* approved contributions
* administrative sources

Every knowledge item should have provenance.

The system must distinguish:

```text
source
document
chunk
embedding
retrieval result
AI response
```

---

# 9. STUDENT PROFILE

Students can control appropriate personal learning information.

Examples:

```text
grade
subjects
target exams
target scores
strong topics
weak topics
learning preferences
study goals
```

Do not store sensitive information unless necessary.

The profile is used to personalize learning, not to create unnecessary surveillance.

---

# 10. ADAPTIVE LEARNING

The central loop:

```text
Learn
 ↓
Practice
 ↓
Answer
 ↓
Evaluate
 ↓
Analyze Errors
 ↓
Update Mastery
 ↓
Recommend Next Action
```

StudyOS should progressively move from:

```text
"Answer this question"
```

toward:

```text
"Here is what you should learn next and why."
```

---

# 11. SUCCESS DEFINITION

StudyOS succeeds when the system can demonstrate:

```text
Student interaction
→ measurable learning event
→ updated mastery state
→ personalized recommendation
```

rather than merely producing convincing AI responses.
