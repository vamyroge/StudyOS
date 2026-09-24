"use client";

import { useState, useEffect } from "react";
import { CalendarHeatmap } from "@/components/learning/calendar-heatmap";
import { ActivityTooltip } from "@/components/learning/activity-tooltip";
import { DailyActivity } from "@/lib/learning/streak";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface OptimizedCalendarProps {
  activities: DailyActivity[];
  onDateHover?: (date: string | null) => void;
  onDateClick?: (date: string) => void;
  loading?: boolean;
}

export function OptimizedCalendar({ activities, onDateHover, onDateClick, loading }: OptimizedCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    date: string;
    activities: Array<{ type: string; count: number }>;
    totalActivities: number;
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsHovering(false);
    }
  }, [loading]);

  const handleDateHover = async (date: string | null) => {
    setHoveredDate(date);
    setIsHovering(true);
    
    if (date && !loading) {
      const activity = activities.find((a) => a.date === date);
      
      if (activity) {
        setTooltipData({
          date,
          activities: [
            { type: "quiz_completed", count: activity.quizCount },
            { type: "question_submitted", count: activity.questionCount },
          ].filter((a) => a.count > 0),
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
      setIsHovering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-1">
          <div className="flex flex-col gap-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((week) => (
              <div key={week} className="flex flex-col gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <Skeleton key={day} className="h-3 w-3 rounded-sm" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  return (
    <div className="relative">
      <CalendarHeatmap 
        activities={activities} 
        onDateHover={handleDateHover}
      />
      
      {isHovering && tooltipData && (
        <ActivityTooltip
          date={tooltipData.date}
          activities={tooltipData.activities}
          totalActivities={tooltipData.totalActivities}
        />
      )}
    </div>
  );
}
