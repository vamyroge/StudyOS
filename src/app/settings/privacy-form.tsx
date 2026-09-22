"use client";

import { useActionState } from "react";
import { savePrivacySettings, type PrivacyState } from "./actions";
import { Button } from "@/components/ui/button";

const fields = [
  ["allowAiProfile", "Hồ sơ học tập"], ["allowAiHistory", "Lịch sử hội thoại"], ["allowAiMistakes", "Lỗi làm bài"], ["allowAiMastery", "Mức độ thành thạo"], ["allowAiStudySessions", "Phiên học"], ["allowPersonalization", "Cá nhân hóa"], ["allowProactiveRecommendations", "Gợi ý chủ động"],
] as const;

export function PrivacyForm({ settings }: { settings: Record<string, boolean> | null }) {
  const [state, action, pending] = useActionState<PrivacyState, FormData>(savePrivacySettings, null);
  return <form action={action} className="mt-4 space-y-3">
    {fields.map(([name, label]) => <label key={name} className="flex items-center justify-between gap-4 text-sm"><span>{label}</span><input type="checkbox" name={name} defaultChecked={settings ? settings[name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] : name !== "allowProactiveRecommendations"} /></label>)}
    {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
    {state && "success" in state && <p className="text-sm text-green-700">Đã lưu cài đặt quyền riêng tư.</p>}
    <Button disabled={pending}>{pending ? "Đang lưu..." : "Lưu cài đặt"}</Button>
  </form>;
}
