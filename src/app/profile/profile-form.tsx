"use client";

import { useActionState } from "react";
import { saveStudentProfile, type ProfileState } from "./actions";
import { Button } from "@/components/ui/button";

export function ProfileForm({ profile, studentProfile }: { profile: { display_name: string | null }; studentProfile: { grade: number; class_name: string | null; target_exam: string | null; learning_goals: string | null } | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveStudentProfile, null);
  return <form action={action} className="mt-6 space-y-4 rounded-lg border p-4">
    <h2 className="text-lg font-semibold">Cập nhật thông tin học tập</h2>
    <label className="block text-sm">Tên hiển thị<input name="displayName" defaultValue={profile.display_name || ""} className="mt-1 w-full rounded-md border p-2" /></label>
    <label className="block text-sm">Khối lớp<select name="grade" defaultValue={studentProfile?.grade || ""} required className="mt-1 w-full rounded-md border p-2"><option value="" disabled>Chọn khối lớp</option><option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option></select></label>
    <label className="block text-sm">Lớp học<input name="className" defaultValue={studentProfile?.class_name || ""} className="mt-1 w-full rounded-md border p-2" /></label>
    <label className="block text-sm">Kỳ thi mục tiêu<input name="targetExam" defaultValue={studentProfile?.target_exam || ""} className="mt-1 w-full rounded-md border p-2" /></label>
    <label className="block text-sm">Mục tiêu học tập<textarea name="learningGoals" defaultValue={studentProfile?.learning_goals || ""} className="mt-1 w-full rounded-md border p-2" rows={3} /></label>
    {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
    {state && "success" in state && <p className="text-sm text-green-700">Đã lưu hồ sơ.</p>}
    <Button disabled={pending}>{pending ? "Đang lưu..." : "Lưu hồ sơ"}</Button>
  </form>;
}
