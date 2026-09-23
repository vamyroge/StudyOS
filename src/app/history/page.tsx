import { requireAuth } from "@/lib/auth/utils";
import { getConversations } from "@/lib/conversations/service";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { ConversationList } from "./conversation-list";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HistoryPage() {
  await requireAuth();
  const conversations = await getConversations(50, 0);
  const supabase = await createClient();

  // Fetch subjects for filter
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .order("name");

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              Lịch sử hội thoại
            </h1>
            <p className="mt-2 text-muted-foreground">
              Xem lại các cuộc trò chuyện với AI Tutor
            </p>
          </div>
          <Link href="/tutor">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Hội thoại mới
            </Button>
          </Link>
        </div>

        {/* Conversations List */}
        <ConversationList initialConversations={conversations} subjects={subjects || []} />
      </div>
    </ProtectedLayout>
  );
}
