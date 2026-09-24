"use client";

import { useState } from "react";
import { CalendarHeatmap } from "@/components/learning/calendar-heatmap";
import { ActivityTooltip } from "@/components/learning/activity-tooltip";
import { DailyActivity } from "@/lib/learning/streak";

interface DashboardStreakSectionProps {
  activities: DailyActivity[];
  startDate?: string;
}

export function DashboardStreakSection({ activities, startDate }: DashboardStreakSectionProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    date: string;
    activities: Array<{ type: string; count: number }>;
    totalActivities: number;
  } | null>(null);

  const handleDateHover = async (date: string | null) => {
    setHoveredDate(date);
    
    if (date) {
      // In a real implementation, we'd fetch activity breakdown from API
      // For now, we'll use the activities data we already have
      const activity = activities.find((a) => a.date === date);
      
      if (activity) {
        const activities = [];
        if (activity.quizCount > 0) activities.push({ type: "quiz_completed", count: activity.quizCount });
        if (activity.questionCount > 0) activities.push({ type: "question_submitted", count: activity.questionCount });
        setTooltipData({
          date,
          activities,
          totalActivities: activity.totalActivities,
        });
      } else {
        setTooltipData({
          date,
          activities: [],
          totalActivities: 0,
        });
      }
    } else {
      setTooltipData(null);
    }
  };

  return (
    <div className="relative">
      <CalendarHeatmap 
        activities={activities} 
        startDate={startDate}
        onDateHover={handleDateHover}
      />
      
      {tooltipData && (
        <ActivityTooltip
          date={tooltipData.date}
          activities={tooltipData.activities}
          totalActivities={tooltipData.totalActivities}
        />
      )}
    </div>
  );
}
