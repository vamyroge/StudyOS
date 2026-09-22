import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: conversationId } = await params;

  // Verify ownership
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  // Delete conversation (messages will cascade delete)
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete conversation:", error);
    return new Response("Failed to delete conversation", { status: 500 });
  }

  return NextResponse.json({ success: true });
}
