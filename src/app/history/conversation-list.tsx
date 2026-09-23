"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Trash2, Search, Calendar, AlertCircle, Filter, X, Edit2, Check } from "lucide-react";
import { deleteConversation, updateConversationTitle, type Conversation } from "@/lib/conversations/service";

interface ConversationListProps {
  initialConversations: Conversation[];
  subjects?: Array<{ id: string; name: string }>;
}

export function ConversationList({ initialConversations, subjects = [] }: ConversationListProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || conv.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa hội thoại này?")) return;

    setDeletingId(id);
    const result = await deleteConversation(id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(result.error || "Không thể xóa hội thoại");
    }
    setDeletingId(null);
  }

  function handleStartEdit(conv: Conversation, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || "");
  }

  async function handleSaveEdit(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!editTitle.trim()) {
      alert("Tiêu đề không được để trống");
      return;
    }

    const result = await updateConversationTitle(id, editTitle.trim());
    if (result.success) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
      setEditingId(null);
    } else {
      alert(result.error || "Không thể đổi tên hội thoại");
    }
  }

  function handleCancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  }

  function handleOpen(id: string) {
    router.push(`/tutor?id=${id}`);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Chưa có hội thoại nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Bắt đầu trò chuyện với AI Tutor để được hỗ trợ học tập
          </p>
          <Button onClick={() => router.push("/tutor")}>
            Bắt đầu hội thoại mới
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm hội thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Subject Filter */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={selectedSubject === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(null)}
            >
              Tất cả
            </Button>
            {subjects.map((subject) => (
              <Button
                key={subject.id}
                variant={selectedSubject === subject.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject(subject.id)}
              >
                {subject.name}
                {selectedSubject === subject.id && (
                  <X className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubject(null);
                  }} />
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {(searchQuery || selectedSubject) && (
        <p className="text-sm text-muted-foreground">
          Tìm thấy {filteredConversations.length} hội thoại
        </p>
      )}

      {/* Conversations */}
      {filteredConversations.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy hội thoại nào
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleOpen(conversation.id)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === conversation.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(conversation.id, e as any);
                            if (e.key === "Escape") handleCancelEdit(e as any);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => handleSaveEdit(conversation.id, e)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                          {conversation.title || "Hội thoại không có tiêu đề"}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(conversation.updated_at)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {editingId !== conversation.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleStartEdit(conversation, e)}
                        title="Đổi tên"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(conversation.id, e)}
                        disabled={deletingId === conversation.id}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {conversation.subject_id && (
                <Badge variant="secondary" className="text-xs">
                  {subjects.find(s => s.id === conversation.subject_id)?.name || "Môn học"}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
