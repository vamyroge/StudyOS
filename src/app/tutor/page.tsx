"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AIResponseRenderer } from "@/components/tutor/ai-response-renderer";
import { Send, Bot, Square, Loader2, Sparkles, History } from "lucide-react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  mode?: "plain_text" | "explanation" | "solution" | "quiz" | "code";
}

interface TutorError {
  message: string;
  retryMessage?: string;
  conversationId?: string;
}

function TutorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<TutorError | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sources, setSources] = useState<Array<{ documentId: string; source: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeRequestRef = useRef(false);

  // Load conversation from URL if conversationId is present
  useEffect(() => {
    const convId = searchParams.get("id");
    if (convId && !loadingHistory && messages.length === 0) {
      loadConversation(convId);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function loadConversation(convId: string) {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (!res.ok) {
        throw new Error("Failed to load conversation");
      }
      const data = await res.json();
      setConversationId(data.conversation.id);
      setMessages(
        data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          mode: msg.metadata?.mode || "plain_text",
        }))
      );
    } catch (err) {
      setError({
        message: "Không thể tải lịch sử hội thoại",
      });
    } finally {
      setLoadingHistory(false);
    }
  }

  async function sendMessage(e: React.FormEvent, retryMessage?: string, retryConversationId?: string) {
    e.preventDefault();
    const message = (retryMessage || input).trim();
    if (!message || loading || activeRequestRef.current) return;

    const userMsg: ChatMessage = { role: "user", content: message };
    if (!retryMessage) {
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
    }
    setLoading(true);
    activeRequestRef.current = true;
    setError(null);

    const assistantIdx = retryMessage ? messages.length : messages.length + 1;
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          conversationId: retryConversationId || conversationId,
          requestId: crypto.randomUUID(),
          retry: Boolean(retryMessage && (retryConversationId || conversationId)),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: { message?: string }; conversationId?: string } | null;
        const requestError = new Error(body?.error?.message || "AI chưa thể xử lý yêu cầu này. Hãy thử lại sau.");
        Object.assign(requestError, { conversationId: body?.conversationId });
        throw requestError;
      }

      const payload = await res.json() as {
        content: string;
        mode: ChatMessage["mode"];
        conversationId: string;
        sources: Array<{ documentId: string; source: string }>;
      };
      
      // Update URL with conversationId if this is the first message
      if (!conversationId && payload.conversationId) {
        router.replace(`/tutor?id=${payload.conversationId}`, { scroll: false });
      }
      
      setConversationId(payload.conversationId);
      setSources(payload.sources || []);
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIdx] = { role: "assistant", content: payload.content, mode: payload.mode };
        return updated;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // cancelled
      } else {
        setError({
          message: err instanceof Error ? err.message : "AI chưa thể xử lý yêu cầu này. Hãy thử lại sau.",
          retryMessage: userMsg.content,
          conversationId: err instanceof Error && "conversationId" in err ? String(err.conversationId || "") || undefined : retryConversationId || conversationId,
        });
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
      activeRequestRef.current = false;
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  const suggestedPrompts = [
    "Giải thích cho tôi về...",
    "Cho tôi một ví dụ về...",
    "Hãy kiểm tra tôi bằng quiz",
    "Tóm tắt nội dung này"
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                xKiro AI Tutor
                <Sparkles className="h-4 w-4 text-primary" />
              </h1>
              <p className="text-xs text-muted-foreground">
                Trợ lý học tập cá nhân hóa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/history")}
              >
                <History className="h-4 w-4 mr-1.5" />
                Lịch sử
              </Button>
            )}
            {loading && (
              <Button variant="destructive" size="sm" onClick={stopGeneration}>
                <Square className="h-3 w-3 mr-1.5" />
                Dừng
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải hội thoại...</p>
              </div>
            </div>
          ) : messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="rounded-full bg-primary/10 p-6 mb-6">
                <Bot className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Bắt đầu học tập</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Đặt câu hỏi về kiến thức, nhờ giải bài tập, hoặc yêu cầu xKiro AI gợi ý ôn tập
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left"
                    onClick={() => setInput(prompt)}
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  
                  <Card className={`max-w-[85%] sm:max-w-[75%] ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50"
                  }`}>
                    <div className="px-4 py-3">
                      {msg.content ? (
                        msg.role === "assistant" ? (
                          <AIResponseRenderer response={{ content: msg.content, mode: msg.mode || "plain_text" }} />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                        )
                      ) : (msg.role === "assistant" && loading && i === messages.length - 1 ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Đang suy nghĩ...</span>
                        </div>
                      ) : null)}
                    </div>
                  </Card>
                  
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                      <span className="text-sm font-semibold">U</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {error && (
            <Card className="border-destructive bg-destructive/10 mt-4">
              <div className="p-4">
                <p className="text-sm text-destructive mb-3">{error.message}</p>
                {error.retryMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => sendMessage(e, error.retryMessage, error.conversationId)}
                    disabled={loading}
                  >
                    Thử lại
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Đặt câu hỏi hoặc mô tả vấn đề bạn cần giúp đỡ..."
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={loading || loadingHistory}
            />
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
              disabled={!input.trim() || loading || loadingHistory}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            xKiro AI có thể mắc sai lầm. Hãy kiểm tra thông tin quan trọng.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    }>
      <TutorContent />
    </Suspense>
  );
}
