"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, Square } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sources, setSources] = useState<Array<{ documentId: string; source: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    const assistantIdx = messages.length + 1;
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, conversationId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

        const payload = await res.json() as {
          content: string;
          conversationId: string;
          sources: Array<{ documentId: string; source: string }>;
        };
        setConversationId(payload.conversationId);
        setSources(payload.sources || []);
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = { role: "assistant", content: payload.content };
          return updated;
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // cancelled
      } else {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            xKiro AI Tutor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hỏi đáp, giải bài và luyện tập cùng xKiro AI
          </p>
        </div>
        {loading && (
          <Button variant="destructive" size="sm" onClick={stopGeneration}>
            <Square className="h-3 w-3 mr-1" />
            Dừng
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Bắt đầu học tập</p>
            <p className="text-sm mt-1 max-w-md">
              Đặt câu hỏi về kiến thức, nhờ giải bài tập, hoặc yêu cầu xKiro AI gợi ý ôn tập.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap " + (msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
              {msg.content || (msg.role === "assistant" && loading ? "..." : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

        {error && (
        <div className="mx-6 mb-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
        )}
        {sources.length > 0 && (
          <div className="mx-6 mb-2 rounded-md border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Nguồn tham khảo</p>
            <ul className="mt-1 space-y-1">
              {sources.map((source) => <li key={source.documentId}>{source.source}</li>)}
            </ul>
          </div>
        )}

      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
