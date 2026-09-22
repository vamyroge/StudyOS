import { requireAuth, getProfile } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, MessageSquare, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { ConversationCard } from "./conversation-card";

export default async function HistoryPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  
  const supabase = await createClient();

  // Fetch conversations - limit to reasonable number
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!conversations || conversations.length === 0) {
    return (
      <ProtectedLayout>
        <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <HistoryIcon className="h-8 w-8 text-primary" />
              Lịch sử hội thoại
            </h1>
            <p className="mt-2 text-muted-foreground">
              Xem lại và quản lý các cuộc trò chuyện với AI Tutor
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Chưa có cuộc hội thoại nào. Bắt đầu chat với AI Tutor!
                </p>
                <Link href="/tutor">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Trò chuyện với AI
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedLayout>
    );
  }

  // Fetch all messages for these conversations in one query
  const conversationIds = conversations.map(c => c.id);
  const { data: allMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, role, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  // Build lookup maps
  const messageCountMap = new Map<string, number>();
  const firstMessageMap = new Map<string, string>();
  
  (allMessages || []).forEach((msg: any) => {
    // Count messages
    const count = messageCountMap.get(msg.conversation_id) || 0;
    messageCountMap.set(msg.conversation_id, count + 1);
    
    // Store first user message as preview
    if (msg.role === "user" && !firstMessageMap.has(msg.conversation_id)) {
      firstMessageMap.set(msg.conversation_id, msg.content);
    }
  });

  const conversationsWithDetails = conversations.map(conv => ({
    ...conv,
    message_count: messageCountMap.get(conv.id) || 0,
    preview: firstMessageMap.get(conv.id) || conv.title
  }));

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-primary" />
            Lịch sử hội thoại
          </h1>
          <p className="mt-2 text-muted-foreground">
            Xem lại và quản lý các cuộc trò chuyện với AI Tutor
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng cuộc hội thoại</p>
                  <p className="text-2xl font-bold">{conversationsWithDetails.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng tin nhắn</p>
                  <p className="text-2xl font-bold">
                    {conversationsWithDetails.reduce((sum, conv) => sum + conv.message_count, 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tuần này</p>
                  <p className="text-2xl font-bold">
                    {conversationsWithDetails.filter(c => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(c.updated_at) > weekAgo;
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Tất cả cuộc hội thoại</CardTitle>
            <CardDescription>
              Nhấn vào để xem chi tiết hoặc tiếp tục trò chuyện
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversationsWithDetails.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Chưa có cuộc hội thoại nào. Bắt đầu chat với AI Tutor!
                </p>
                <Link href="/tutor">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Trò chuyện với AI
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationsWithDetails.map((conv) => (
                  <ConversationCard key={conv.id} conversation={conv} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
