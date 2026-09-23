"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export async function createConversation(subjectId?: string): Promise<{ id: string; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      subject_id: subjectId || null,
      title: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { id: "", error: "Failed to create conversation" };
  }

  return { id: data.id };
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
    metadata: metadata || {},
  });

  if (error) {
    return { success: false, error: "Failed to save message" };
  }

  // Update conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { success: true };
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to update title" };
  }

  return { success: true };
}

export async function getConversations(
  limit = 50,
  offset = 0
): Promise<Conversation[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getConversationWithMessages(
  conversationId: string
): Promise<{ conversation: Conversation | null; messages: Message[] }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: conversation }, { data: messages }] = await Promise.all([
    supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    conversation: conversation || null,
    messages: messages || [],
  };
}

export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to delete conversation" };
  }

  return { success: true };
}

export async function generateConversationTitle(
  firstUserMessage: string
): Promise<string> {
  // Generate a short title from the first message
  const maxLength = 50;
  const cleaned = firstUserMessage.trim().replace(/\s+/g, " ");
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate and add ellipsis
  return cleaned.substring(0, maxLength - 3) + "...";
}
