"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveStudentProfile, type ProfileState } from "./actions";

const initialState: ProfileState = null;

type ProfileData = {
  display_name?: string;
  grade?: number;
  class_name?: string;
  target_exam?: string;
  learning_goals?: string;
  subjects?: string[];
  study_preferences?: {
    strong_topics?: string;
    weak_topics?: string;
    study_time_per_day?: string;
    preferred_learning_style?: string;
    target_score?: string;
  };
};

export function ProfileForm({ profile }: { profile: ProfileData | null }) {
  const [state, action, pending] = useActionState(saveStudentProfile, initialState);

  return (
    <form action={action} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Thông tin cơ bản</h3>
        
        <div className="space-y-2">
          <Label htmlFor="displayName">Tên hiển thị <span className="text-destructive">*</span></Label>
          <Input 
            id="displayName" 
            name="displayName" 
            defaultValue={profile?.display_name || ""} 
            placeholder="Nhập tên hiển thị của bạn" 
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="grade">Khối lớp <span className="text-destructive">*</span></Label>
            <select 
              id="grade" 
              name="grade" 
              defaultValue={profile?.grade?.toString() || ""} 
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Chọn khối</option>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="className">Tên lớp</Label>
            <Input 
              id="className" 
              name="className" 
              defaultValue={profile?.class_name || ""} 
              placeholder="VD: 12A1" 
            />
          </div>
        </div>
      </div>

      {/* Academic Goals */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mục tiêu học tập</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetExam">Kỳ thi mục tiêu</Label>
            <Input 
              id="targetExam" 
              name="targetExam" 
              defaultValue={profile?.target_exam || ""} 
              placeholder="VD: THPT Quốc gia 2027" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetScore">Điểm mục tiêu</Label>
            <Input 
              id="targetScore" 
              name="targetScore" 
              defaultValue={profile?.study_preferences?.target_score || ""} 
              placeholder="VD: 8.5 điểm trung bình" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="learningGoals">Mục tiêu chi tiết</Label>
          <Textarea 
            id="learningGoals" 
            name="learningGoals" 
            defaultValue={profile?.learning_goals || ""} 
            rows={3} 
            placeholder="VD: Đạt 8+ điểm Toán THPT, nắm vững Hóa hữu cơ, cải thiện kỹ năng giải bài tập Vật lý..." 
          />
        </div>
      </div>

      {/* Subjects */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Môn học</h3>
        
        <div className="space-y-2">
          <Label>Môn học đang theo học</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: "math", label: "Toán" },
              { id: "physics", label: "Vật lý" },
              { id: "chemistry", label: "Hóa học" },
              { id: "biology", label: "Sinh học" },
              { id: "literature", label: "Ngữ văn" },
              { id: "english", label: "Tiếng Anh" },
            ].map((subject) => (
              <label key={subject.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input hover:bg-accent cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="subjects"
                  value={subject.id}
                  defaultChecked={profile?.subjects?.includes(subject.id)}
                  className="rounded border-input"
                />
                <span className="text-sm">{subject.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Profile */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hồ sơ học tập</h3>
        
        <div className="space-y-2">
          <Label htmlFor="strongTopics">Chủ đề bạn giỏi</Label>
          <Textarea 
            id="strongTopics" 
            name="strongTopics" 
            defaultValue={profile?.study_preferences?.strong_topics || ""} 
            rows={2} 
            placeholder="VD: Đại số, Phương trình, Hàm số bậc 2..." 
          />
          <p className="text-xs text-muted-foreground">AI sẽ biết điểm mạnh của bạn để điều chỉnh độ khó phù hợp</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weakTopics">Chủ đề cần cải thiện</Label>
          <Textarea 
            id="weakTopics" 
            name="weakTopics" 
            defaultValue={profile?.study_preferences?.weak_topics || ""} 
            rows={2} 
            placeholder="VD: Hình học không gian, Phản ứng oxi hóa khử..." 
          />
          <p className="text-xs text-muted-foreground">AI sẽ tập trung hỗ trợ nhiều hơn ở các phần này</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="studyTimePerDay">Thời gian học mỗi ngày</Label>
            <select 
              id="studyTimePerDay" 
              name="studyTimePerDay" 
              defaultValue={profile?.study_preferences?.study_time_per_day || ""} 
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Chọn thời gian</option>
              <option value="1-2h">1-2 giờ</option>
              <option value="2-4h">2-4 giờ</option>
              <option value="4-6h">4-6 giờ</option>
              <option value="6h+">Trên 6 giờ</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLearningStyle">Phong cách học ưa thích</Label>
            <select 
              id="preferredLearningStyle" 
              name="preferredLearningStyle" 
              defaultValue={profile?.study_preferences?.preferred_learning_style || ""} 
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Chọn phong cách</option>
              <option value="visual">Hình ảnh/Sơ đồ</option>
              <option value="step-by-step">Từng bước chi tiết</option>
              <option value="conceptual">Lý thuyết/Khái niệm</option>
              <option value="practice">Thực hành/Bài tập</option>
            </select>
          </div>
        </div>
      </div>

      {state && "error" in state && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive" role="alert">{state.error}</p>
        </div>
      )}
      
      {state && "success" in state && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-700" role="status">
            ✓ Đã lưu thông tin học tập. AI sẽ sử dụng dữ liệu này để cá nhân hóa câu trả lời cho bạn.
          </p>
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Đang lưu..." : "Lưu thông tin"}
      </Button>
    </form>
  );
}
