"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface QuizHistoryFiltersProps {
  subjects: Array<{ id: string; name: string }>;
  currentParams: {
    subject?: string;
    difficulty?: string;
    minScore?: string;
    sort?: string;
  };
}

export function QuizHistoryFilters({ subjects, currentParams }: QuizHistoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/quiz/history?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/quiz/history");
  };

  const hasFilters = currentParams.subject || currentParams.difficulty || currentParams.minScore;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Bộ lọc</span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Môn học</label>
            <Select
              value={currentParams.subject || "all"}
              onValueChange={(value) =>
                updateFilter("subject", value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả môn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Độ khó</label>
            <Select
              value={currentParams.difficulty || "all"}
              onValueChange={(value) =>
                updateFilter("difficulty", value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="basic">Cơ bản</SelectItem>
                <SelectItem value="intermediate">Trung bình</SelectItem>
                <SelectItem value="advanced">Nâng cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Điểm tối thiểu</label>
            <Select
              value={currentParams.minScore || "all"}
              onValueChange={(value) =>
                updateFilter("minScore", value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="80">≥ 80 điểm</SelectItem>
                <SelectItem value="70">≥ 70 điểm</SelectItem>
                <SelectItem value="60">≥ 60 điểm</SelectItem>
                <SelectItem value="50">≥ 50 điểm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sắp xếp</label>
            <Select
              value={currentParams.sort || "recent"}
              onValueChange={(value) =>
                updateFilter("sort", value === "recent" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Mới nhất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mới nhất</SelectItem>
                <SelectItem value="highest">Điểm cao nhất</SelectItem>
                <SelectItem value="lowest">Điểm thấp nhất</SelectItem>
                <SelectItem value="mistakes">Nhiều sai nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
