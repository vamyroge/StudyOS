"use client";

import { QuizPerformanceData } from "@/lib/dashboard/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface PerformanceChartProps {
  data: QuizPerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Xu hướng điểm số
          </CardTitle>
          <CardDescription>Chưa có dữ liệu quiz</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Hoàn thành quiz đầu tiên để xem biểu đồ tiến bộ
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxScore = 100;
  const chartHeight = 200;

  // Calculate trend
  let trend: "up" | "down" | "stable" = "stable";
  if (data.length >= 2) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.accuracy, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.accuracy, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) trend = "up";
    else if (secondAvg < firstAvg - 5) trend = "down";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Xu hướng điểm số
        </CardTitle>
        <CardDescription>
          {data.length} quiz gần nhất
          {trend === "up" && " • 📈 Đang tiến bộ"}
          {trend === "down" && " • 📉 Cần cải thiện"}
          {trend === "stable" && " • ➡️ Ổn định"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: chartHeight + 40 }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs text-muted-foreground">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0" style={{ height: chartHeight }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((value) => (
                <div key={value} className="border-t border-muted" />
              ))}
            </div>

            {/* SVG for line chart */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Area fill */}
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area */}
              <path
                d={generateAreaPath(data, chartHeight)}
                fill="url(#areaGradient)"
                className="transition-all duration-300"
              />

              {/* Line */}
              <path
                d={generateLinePath(data, chartHeight)}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="transition-all duration-300"
              />

              {/* Points */}
              {data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = ((100 - point.accuracy) / 100) * chartHeight;
                return (
                  <g key={index}>
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill="hsl(var(--background))"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:r-6"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltips */}
            <div className="absolute inset-0 flex justify-between items-end">
              {data.map((point, index) => (
                <div
                  key={index}
                  className="group relative flex-1 h-full cursor-pointer"
                  style={{ maxWidth: `${100 / data.length}%` }}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap z-10 pointer-events-none mb-2">
                    <p className="font-medium">{Math.round(point.accuracy)}%</p>
                    <p className="text-muted-foreground">
                      {point.correctAnswers}/{point.totalQuestions} đúng
                    </p>
                    <p className="text-muted-foreground">{point.subjectName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-muted-foreground">
            {data.map((point, index) => {
              // Show only first, middle, and last labels to avoid crowding
              if (
                index === 0 ||
                index === Math.floor(data.length / 2) ||
                index === data.length - 1
              ) {
                return (
                  <span key={index} className="text-center" style={{ flex: 1 }}>
                    Quiz {index + 1}
                  </span>
                );
              }
              return <span key={index} style={{ flex: 1 }} />;
            })}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">TB</p>
            <p className="text-lg font-bold">
              {Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Cao nhất</p>
            <p className="text-lg font-bold text-green-600">
              {Math.round(Math.max(...data.map((d) => d.accuracy)))}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Thấp nhất</p>
            <p className="text-lg font-bold text-red-600">
              {Math.round(Math.min(...data.map((d) => d.accuracy)))}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function generateLinePath(data: QuizPerformanceData[], height: number): string {
  if (data.length === 0) return "";
  if (data.length === 1) {
    const x = 50;
    const y = ((100 - data[0].accuracy) / 100) * height;
    return `M ${x}% ${y}`;
  }

  return data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((100 - point.accuracy) / 100) * height;
      return `${index === 0 ? "M" : "L"} ${x}% ${y}`;
    })
    .join(" ");
}

function generateAreaPath(data: QuizPerformanceData[], height: number): string {
  if (data.length === 0) return "";

  const linePath = generateLinePath(data, height);
  const lastX = 100;
  const firstX = 0;

  return `${linePath} L ${lastX}% ${height} L ${firstX}% ${height} Z`;
}
