"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitKnowledgeContribution, type ContributionState } from "./contribution-actions";

const initialState: ContributionState = null;

export function ContributionForm({ subjects }: { subjects: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(submitKnowledgeContribution, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="contribution-title" className="text-sm font-medium">Tiêu đề tài liệu</label>
        <Input id="contribution-title" name="title" required maxLength={300} placeholder="Ví dụ: Tóm tắt định luật Boyle" />
      </div>
      <div className="space-y-2">
        <label htmlFor="contribution-source" className="text-sm font-medium">Nguồn tham khảo</label>
        <Input id="contribution-source" name="source" maxLength={500} placeholder="Sách giáo khoa, URL, hoặc ghi chú cá nhân" />
      </div>
      <div className="space-y-2">
        <label htmlFor="contribution-subject" className="text-sm font-medium">Môn học</label>
        <select id="contribution-subject" name="subjectId" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Chưa phân loại</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="contribution-content" className="text-sm font-medium">Nội dung</label>
        <Textarea id="contribution-content" name="content" maxLength={20000} rows={10} placeholder="Nhập nội dung kiến thức, hoặc đính kèm file bên dưới." />
      </div>
      <div className="space-y-2">
        <label htmlFor="contribution-file" className="text-sm font-medium">Đính kèm file (tùy chọn)</label>
        <Input id="contribution-file" name="file" type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" />
        <p className="text-xs text-muted-foreground">Hỗ trợ TXT, Markdown và CSV, tối đa 10MB. File được lưu riêng tư và chỉ dùng sau khi duyệt.</p>
      </div>
      {state && "error" in state && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green-700" role="status">Đã gửi để kiểm duyệt. Nội dung chỉ được dùng cho AI sau khi admin phê duyệt.</p>}
      <Button type="submit" disabled={pending}>{pending ? "Đang gửi..." : "Gửi để kiểm duyệt"}</Button>
    </form>
  );
}
