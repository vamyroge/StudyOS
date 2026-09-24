import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculatePercentage(value: number, total: number): number | null {
  if (total === 0) return null
  return Math.round((value / total) * 1000) / 10
}

export function formatPercentage(value: number | null): string {
  if (value === null) return "Chưa có dữ liệu"
  return `${value}%`
}

export function formatScore(score: number | null, max: number = 100): string {
  if (score === null) return "Chưa có dữ liệu"
  return `${Math.round(score)}/${max}`
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return "N/A"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}
