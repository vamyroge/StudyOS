"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

export function ChatHistorySection({ conversations }: { conversations: Conversation[] }) {
  const [convos, setConvos] = useState(conversations);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (conversationId: string) => {
    if (!confirm("Bạn có chắc muốn xóa cuộc hội thoại này?")) return;
    
    setDeleting(conversationId);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setConvos(convos.filter(c => c.id !== conversationId));
      } else {
        alert("Không thể xóa cuộc hội thoại");
      }
    } catch (error) {
      alert("Đã xảy ra lỗi khi xóa");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Lịch sử hội thoại
        </CardTitle>
        <CardDescription>
          Quản lý các cuộc trò chuyện với AI Tutor của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {convos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có cuộc hội thoại nào. Bắt đầu chat với AI Tutor để xem lịch sử tại đây.
          </p>
        ) : (
          <div className="space-y-3">
            {convos.slice(0, 5).map((convo) => (
              <div
                key={convo.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{convo.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(convo.updated_at).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" • "}
                    {convo.message_count} tin nhắn
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/tutor?conversation=${convo.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(convo.id)}
                    disabled={deleting === convo.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {convos.length > 5 && (
              <Link href="/tutor">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Xem tất cả {convos.length} cuộc hội thoại →
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
