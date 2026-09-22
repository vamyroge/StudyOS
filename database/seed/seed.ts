import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function upsertSeed() {
  const { data: subjects } = await supabase.from("subjects").select("id, slug");
  if (!subjects || subjects.length === 0) {
    console.log("No subjects found. Run migrations first.");
    return;
  }

  const math = subjects.find((s: { slug: string }) => s.slug === "math");
  if (!math) {
    console.log("Math subject not found.");
    return;
  }

  const { data: existingChapters } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("subject_id", math.id);

  let chapters = existingChapters || [];
  const chapterNames = ["Hàm số", "Đại số"];

  for (let i = 0; i < chapterNames.length; i++) {
    const existing = chapters.find((c: { name: string }) => c.name === chapterNames[i]);
    if (!existing) {
      const { data: inserted } = await supabase
        .from("chapters")
        .insert({ subject_id: math.id, name: chapterNames[i], order: i + 1 })
        .select();
      if (inserted) chapters = [...chapters, ...inserted];
    }
  }

  if (chapters.length === 0) return;

  const { data: existingTopics } = await supabase
    .from("topics")
    .select("id, name, chapter_id")
    .eq("chapter_id", chapters[0].id);

  let topics = existingTopics || [];
  const topicNames = ["Hàm số bậc nhất", "Hàm số bậc hai"];

  for (let i = 0; i < topicNames.length; i++) {
    const existing = topics.find((t: { name: string }) => t.name === topicNames[i]);
    if (!existing) {
      const { data: inserted } = await supabase
        .from("topics")
        .insert({ chapter_id: chapters[0].id, name: topicNames[i], order: i + 1 })
        .select();
      if (inserted) topics = [...topics, ...inserted];
    }
  }

  if (topics.length === 0) return;

  const { data: primaryConcept } = await supabase
    .from("concepts")
    .select("id")
    .eq("topic_id", topics[0].id)
    .order("name")
    .limit(1)
    .single();
  if (!primaryConcept) throw new Error("No concept available for question mapping.");

  const { data: existingConcepts } = await supabase
    .from("concepts")
    .select("id, name, topic_id")
    .eq("topic_id", topics[0].id);

  const conceptDefs = [
    { name: "Định nghĩa hàm số", description: "Khái niệm cơ bản về hàm số" },
    { name: "Tập xác định", description: "Tập giá trị đầu vào của hàm số" },
  ];

  for (const def of conceptDefs) {
    const existing = (existingConcepts || []).find((c: { name: string }) => c.name === def.name);
    if (!existing) {
      await supabase
        .from("concepts")
        .insert({ topic_id: topics[0].id, name: def.name, description: def.description });
    }
  }

  const questionDefs = [
    {
      content: "Hàm số y = 2x + 3 có hệ số góc bằng bao nhiêu?",
      options: ["2", "3", "-2", "1"],
      correctIndex: 0,
    },
    {
      content: "Tập xác định của hàm số y = 1/x là gì?",
      options: ["R", "R \\ {0}", "[0, +∞)", "(-∞, 0]"],
      correctIndex: 1,
    },
  ];

  for (let i = 0; i < questionDefs.length; i++) {
    let { data: question } = await supabase
      .from("questions")
      .select("id")
      .eq("content", questionDefs[i].content)
      .maybeSingle();

    if (!question) {
      const { data: inserted, error } = await supabase.from("questions").insert({
        content: questionDefs[i].content,
        subject_id: math.id,
        chapter_id: chapters[0].id,
        topic_id: topics[0].id,
        difficulty: i === 0 ? 0.3 : 0.5,
        question_type: "multiple_choice",
        status: "approved",
      }).select("id").single();
      if (error || !inserted) throw new Error("Could not seed question.");
      question = inserted;
    }

    const { count } = await supabase.from("question_options").select("id", { count: "exact", head: true }).eq("question_id", question.id);
    if (!count) {
      const { error } = await supabase.from("question_options").insert(questionDefs[i].options.map((content, index) => ({ question_id: question!.id, content, is_correct: index === questionDefs[i].correctIndex, order: index + 1 })));
      if (error) throw new Error("Could not seed question options.");
    }

    const { count: mappingCount } = await supabase.from("question_concepts").select("question_id", { count: "exact", head: true }).eq("question_id", question.id);
    if (!mappingCount) {
      const { error } = await supabase.from("question_concepts").insert({ question_id: question.id, concept_id: primaryConcept.id });
      if (error) throw new Error("Could not seed question concept mapping.");
    }
  }

  console.log("Seed completed successfully (idempotent).");
}

upsertSeed().catch(console.error);
