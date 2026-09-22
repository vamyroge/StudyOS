export const siteConfig = {
  name: "StudyOS",
  description: "AI Study Platform cho học sinh THPT Việt Nam",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  mvpSubjects: ["math", "physics", "chemistry"],
} as const;

export const featureFlags = {
  adaptiveLearning: process.env.NEXT_PUBLIC_ADAPTIVE_LEARNING_ENABLED === "true",
  proactiveAI: process.env.NEXT_PUBLIC_PROACTIVE_AI_ENABLED === "true",
} as const;
