"use client";

import { QuizRecommendation, getRecommendationStyle } from "@/lib/quiz/recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface RecommendationsCardProps {
  recommendations: QuizRecommendation[];
  onDismiss?: (id: string) => void;
}

export function RecommendationsCard({ recommendations, onDismiss }: RecommendationsCardProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    onDismiss?.(id);
    
    // Call API to dismiss
    try {
      await fetch("/api/recommendations/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: id }),
      });
    } catch (error) {
      console.error("Failed to dismiss recommendation:", error);
    }
  };

  const visibleRecommendations = recommendations.filter((r) => !dismissed.has(r.id));

  if (visibleRecommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Gợi ý tiếp theo
        </CardTitle>
        <CardDescription>Dựa trên kết quả quiz của bạn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleRecommendations.map((rec) => {
          const style = getRecommendationStyle(rec.recommendationType);
          return (
            <div
              key={rec.id}
              className={`relative rounded-lg border p-4 ${style.bgColor} transition-all hover:shadow-md`}
            >
              <button
                onClick={() => handleDismiss(rec.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className={`text-3xl ${style.color}`}>{style.icon}</div>
                <div className="flex-1 space-y-2">
                  <h4 className={`font-semibold ${style.color}`}>{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>

                  {rec.actionUrl && (
                    <Link href={rec.actionUrl}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={async () => {
                          // Mark as acted on
                          try {
                            await fetch("/api/recommendations/act", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ recommendationId: rec.id }),
                            });
                          } catch (error) {
                            console.error("Failed to mark recommendation:", error);
                          }
                        }}
                      >
                        {rec.recommendationType === "review_topic" && "Ôn tập ngay"}
                        {rec.recommendationType === "retry_quiz" && "Làm lại"}
                        {rec.recommendationType === "challenge_advanced" && "Thử thách"}
                        {rec.recommendationType === "ask_ai_tutor" && "Hỏi AI"}
                        {rec.recommendationType === "practice_more" && "Luyện tập"}
                        {!["review_topic", "retry_quiz", "challenge_advanced", "ask_ai_tutor", "practice_more"].includes(rec.recommendationType) && "Xem thêm"}
                        {" →"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
