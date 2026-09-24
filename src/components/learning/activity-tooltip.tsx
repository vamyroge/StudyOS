"use client";

import { useState, useEffect } from "react";
import { formatActivityType } from "@/lib/learning/streak";

// Format activity for display with icons
function formatActivityForDisplay(type: string, count: number): string {
  if (type === "quiz_completed") {
    return `${count} quiz${count > 1 ? "s" : ""}`;
  }
  if (type === "question_submitted") {
    return `${count} câu hỏi`;
  }
  if (type === "lesson_completed") {
    return `${count} bài học`;
  }
  if (type === "study_task_completed") {
    return `${count} task`;
  }
  if (type === "review_session_completed") {
    return `${count} buổi ôn`;
  }
  if (type === "conversation_created") {
    return `${count} hội thoại AI`;
  }
  return `${count} ${type.replace(/_/g, " ")}`;
}

interface ActivityTooltipProps {
  date: string | null;
  activities: Array<{ type: string; count: number }>;
  totalActivities: number;
}

export function ActivityTooltip({ date, activities, totalActivities }: ActivityTooltipProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (date) {
        setPosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [date]);

  if (!date || !position) return null;

  const formattedDate = new Date(date).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x + 12,
        top: position.y + 12,
        maxWidth: "300px",
      }}
    >
      <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-3 text-sm max-w-xs">
        <p className="font-semibold mb-2 border-b pb-2 text-base">{formattedDate}</p>
        <p className="text-xs text-muted-foreground mb-2">
          📊 Tổng hoạt động: <strong className="text-foreground">{totalActivities}</strong>
        </p>
        
        {activities.length > 0 ? (
          <div className="space-y-1">
            {activities.map((activity, i) => {
              const formatted = formatActivityForDisplay(activity.type, activity.count);
              return (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {activity.type === "quiz_completed" && "📚"}
                    {activity.type === "question_submitted" && "📝"}
                    {activity.type === "lesson_completed" && "📖"}
                    {activity.type === "study_task_completed" && "✅"}
                    {activity.type === "review_session_completed" && "🔄"}
                    {activity.type === "conversation_created" && "💬"}
                  </span>
                  <span className="font-medium">{formatted}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Không có hoạt động hôm nay</p>
        )}
      </div>
    </div>
  );
}
