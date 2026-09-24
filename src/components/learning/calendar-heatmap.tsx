"use client";

import { useState } from "react";
import { DailyActivity } from "@/lib/learning/streak";

interface CalendarHeatmapProps {
  activities: DailyActivity[];
  startDate?: string;
  onDateHover?: (date: string | null) => void;
  onDateClick?: (date: string) => void;
}

export function CalendarHeatmap({ activities, startDate, onDateHover, onDateClick }: CalendarHeatmapProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const days = generateDaysFrom(startDate);
  
  // Create activity map for quick lookup
  const activityMap = new Map(activities.map((a) => [a.date, a]));

  // Group days by week (Sunday to Saturday)
  const weeks = groupByWeek(days);

  const handleMouseEnter = (date: string) => {
    setHoveredDate(date);
    onDateHover?.(date);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
    onDateHover?.(null);
  };

  return (
    <div className="flex flex-col gap-2 w-full overflow-x-auto">
      <div className="flex gap-1 text-xs text-muted-foreground mb-1 ml-8 min-w-max">
        {getMonthLabels(days).map((month, i) => (
          <div key={i} style={{ width: `${month.width * 14}px` }}>
            {month.label}
          </div>
        ))}
      </div>

      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground justify-between pr-2" style={{ height: `${7 * 14}px` }}>
          <div className="h-[12px]"></div>
          <div className="h-[12px]">T.3</div>
          <div className="h-[12px]">T.5</div>
          <div className="h-[12px]">T.7</div>
          <div className="h-[12px]"></div>
          <div className="h-[12px]">T.2</div>
          <div className="h-[12px]">T.4</div>
        </div>

        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const activity = activityMap.get(day);
                const level = activity?.activityLevel || "none";
                
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-[12px] h-[12px] rounded-sm cursor-pointer transition-all ${getActivityColor(level)} ${
                      hoveredDate === day ? "ring-2 ring-primary ring-offset-1 scale-125 z-10" : ""
                    }`}
                    onMouseEnter={() => handleMouseEnter(day)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => day && onDateClick?.(day)}
                    title={`${formatDate(day)}: ${activity?.totalActivities || 0} hoạt động`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>Ít</span>
        <div className="flex gap-1">
          <div className={`w-3 h-3 rounded-sm ${getActivityColor("none")}`} />
          <div className={`w-3 h-3 rounded-sm ${getActivityColor("low")}`} />
          <div className={`w-3 h-3 rounded-sm ${getActivityColor("medium")}`} />
          <div className={`w-3 h-3 rounded-sm ${getActivityColor("high")}`} />
        </div>
        <span>Nhiều</span>
      </div>
    </div>
  );
}

function getActivityColor(level: "none" | "low" | "medium" | "high"): string {
  const colors = {
    none: "bg-blue-50 dark:bg-blue-950/30",
    low: "bg-blue-200 dark:bg-blue-800/50",
    medium: "bg-blue-400 dark:bg-blue-600",
    high: "bg-blue-600 dark:bg-blue-400",
  };
  return colors[level];
}

function generateDaysFrom(startDate?: string): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);

  if (startDate) {
    const parsed = new Date(startDate);
    parsed.setHours(0, 0, 0, 0);
    if (!isNaN(parsed.getTime()) && parsed > start) {
      start = parsed;
    }
  }

  const cursor = new Date(start);
  while (cursor <= today) {
    days.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function groupByWeek(days: string[]): string[][] {
  const weeks: string[][] = [];
  let currentWeek: string[] = [];
  
  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = new Date(days[0]).getDay();
  
  // Add empty slots for alignment
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push("");
  }
  
  days.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  
  // Add last week if not empty
  if (currentWeek.length > 0) {
    // Fill remaining slots
    while (currentWeek.length < 7) {
      currentWeek.push("");
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
}

function getMonthLabels(days: string[]): Array<{ label: string; width: number }> {
  const months: Array<{ label: string; width: number }> = [];
  let currentMonth = "";
  let weekCount = 0;
  
  days.forEach((day, index) => {
    const date = new Date(day);
    const monthLabel = date.toLocaleDateString("vi-VN", { month: "short" });
    
    if (index === 0 || monthLabel !== currentMonth) {
      if (weekCount > 0) {
        months.push({ label: currentMonth, width: weekCount });
      }
      currentMonth = monthLabel;
      weekCount = 1;
    } else if (date.getDay() === 0) {
      // New week
      weekCount++;
    }
  });
  
  // Add last month
  if (weekCount > 0) {
    months.push({ label: currentMonth, width: weekCount });
  }
  
  return months;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  });
}

// Format activity for display
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
  return `${count} ${type.replace(/_/g, " ")}`;
}
