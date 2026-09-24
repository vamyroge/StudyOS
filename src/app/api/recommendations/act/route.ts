import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { recommendationId } = await request.json();

    if (!recommendationId) {
      return NextResponse.json(
        { error: "Recommendation ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Mark as acted on
    const { error } = await supabase
      .from("quiz_recommendations")
      .update({ acted_on_at: new Date().toISOString() })
      .eq("id", recommendationId)
      .is("acted_on_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark recommendation" },
      { status: 500 }
    );
  }
}
