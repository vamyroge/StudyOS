import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { QuizSetup } from "./quiz-setup";
import { Brain, Target } from "lucide-react";

export default async function QuizPage() {
  await requireAuth();
  const supabase = await createClient();

  // Fetch subjects for selection
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .order("name");

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Target className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quiz & Đánh giá
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kiểm tra kiến thức và đánh giá trình độ của bạn
          </p>
        </div>

        {/* Quiz Setup */}
        <QuizSetup subjects={subjects || []} />
      </div>
    </ProtectedLayout>
  );
}
