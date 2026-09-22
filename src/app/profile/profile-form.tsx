"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveStudentProfile, type ProfileState } from "./actions";

const initialState: ProfileState = null;

export function ProfileForm({ profile }: { profile: { display_name?: string; grade?: number; class_name?: string; target_exam?: string; learning_goals?: string; subjects?: string[] } | null }) {
  const [state, action, pending] = useActionState(saveStudentProfile, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiển thị</Label>
        <Input id="displayName" name="displayName" defaultValue={profile?.display_name || ""} placeholder="Nhập tên hiển thị" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="grade">Khối lớp</Label>
          <select id="grade" name="grade" defaultValue={profile?.grade || ""} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Chọn khối</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="className">Tên lớp</Label>
          <Input id="className" name="className" defaultValue={profile?.class_name || ""} placeholder="VD: 12A1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetExam">Kỳ thi mục tiêu</Label>
        <Input id="targetExam" name="targetExam" defaultValue={profile?.target_exam || ""} placeholder="VD: THPT Quốc gia 2027" />
      </div>

      <div className="space-y-2">
        <Label>Môn học quan tâm</Label>
        <div className="flex flex-wrap gap-3">
          {[
            { id: "math", label: "Toán" },
            { id: "physics", label: "Vật lý" },
            { id: "chemistry", label: "Hóa học" },
          ].map((subject) => (
            <label key={subject.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="subjects"
                value={subject.id}
                defaultChecked={profile?.subjects?.includes(subject.id)}
                className="rounded border-input"
              />
              {subject.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="learningGoals">Mục tiêu học tập</Label>
        <Textarea id="learningGoals" name="learningGoals" defaultValue={profile?.learning_goals || ""} rows={3} placeholder="VD: Đạt 8+ điểm Toán THPT, nắm vững Hóa hữu cơ..." />
      </div>

      {state && "error" in state && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green-700" role="status">Đã lưu thông tin học tập. AI sẽ sử dụng dữ liệu này để cá nhân hóa câu trả lời.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu..." : "Lưu thông tin"}
      </Button>
    </form>
  );
}
