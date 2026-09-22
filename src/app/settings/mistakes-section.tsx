"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown } from "lucide-react";

type Mistake = {
  id: string;
  error_type: string;
  concept_name: string | null;
  created_at: string;
  evidence: string | null;
};

const errorTypeLabels: Record<string, string> = {
  conceptual: "Lỗi khái niệm",
  procedural: "Lỗi thủ tục",
  calculation: "Lỗi tính toán",
  unknown: "Lỗi khác",
};

const errorTypeColors: Record<string, "destructive" | "secondary" | "outline"> = {
  conceptual: "destructive",
  procedural: "secondary",
  calculation: "outline",
  unknown: "outline",
};

export function MistakesSection({ mistakes }: { mistakes: Mistake[] }) {
  // Group mistakes by concept
  const mistakesByConcept = mistakes.reduce((acc, mistake) => {
    const concept = mistake.concept_name || "Chưa phân loại";
    if (!acc[concept]) {
      acc[concept] = [];
    }
    acc[concept].push(mistake);
    return acc;
  }, {} as Record<string, Mistake[]>);

  const topMistakes = Object.entries(mistakesByConcept)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Lỗi làm bài
        </CardTitle>
        <CardDescription>
          Phân tích các lỗi thường gặp để cải thiện
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mistakes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có dữ liệu lỗi. Làm bài tập để AI phân tích điểm yếu của bạn.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                Tổng quan
              </div>
              <p className="text-sm text-muted-foreground">
                Bạn đã mắc <span className="font-semibold text-foreground">{mistakes.length}</span> lỗi
                trong <span className="font-semibold text-foreground">{Object.keys(mistakesByConcept).length}</span> khái niệm khác nhau
              </p>
            </div>

            {/* Top mistakes by concept */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Khái niệm hay mắc lỗi nhất</h4>
              {topMistakes.map(([concept, conceptMistakes]) => (
                <div
                  key={concept}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{concept}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {Array.from(new Set(conceptMistakes.map(m => m.error_type))).map(type => (
                        <Badge
                          key={type}
                          variant={errorTypeColors[type] || "outline"}
                          className="text-xs"
                        >
                          {errorTypeLabels[type] || type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-orange-500">
                      {conceptMistakes.length}
                    </p>
                    <p className="text-xs text-muted-foreground">lần</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent mistakes */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Lỗi gần đây</h4>
              {mistakes.slice(0, 3).map((mistake) => (
                <div
                  key={mistake.id}
                  className="p-3 rounded-lg border bg-card text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {mistake.concept_name || "Chưa phân loại"}
                    </span>
                    <Badge variant={errorTypeColors[mistake.error_type] || "outline"} className="text-xs">
                      {errorTypeLabels[mistake.error_type] || mistake.error_type}
                    </Badge>
                  </div>
                  {mistake.evidence && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {mistake.evidence}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(mistake.created_at).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
