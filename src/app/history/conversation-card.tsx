"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
};

export function ConversationCard({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  
  const now = new Date();
  const isToday = new Date(conversation.updated_at).toDateString() === now.toDateString();
  const isRecent = now.getTime() - new Date(conversation.updated_at).getTime() < 3600000; // 1 hour
  
  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa cuộc hội thoại "${conversation.title}"?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        alert("Không thể xóa cuộc hội thoại");
        setDeleting(false);
      }
    } catch {
      alert("Đã xảy ra lỗi khi xóa");
      setDeleting(false);
    }
  };
  
  return (
    <div className="group relative flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{conversation.title}</h3>
          {isRecent && (
            <Badge variant="secondary" className="text-xs">Mới</Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {conversation.preview}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {conversation.message_count} tin nhắn
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isToday ? "Hôm nay" : new Date(conversation.updated_at).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "short"
            })}
            {" "}
            {new Date(conversation.updated_at).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/tutor?conversation=${conversation.id}`}>
          <Button variant="ghost" size="sm" title="Mở cuộc hội thoại">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Xóa cuộc hội thoại"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
