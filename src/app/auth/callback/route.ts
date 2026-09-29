import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeRedirectPath(url.searchParams.get("next"), "/verify-email");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    // If verification fails, redirect to verify-email with error
    return NextResponse.redirect(new URL("/verify-email?error=verification_failed", url.origin));
  }

  return NextResponse.redirect(new URL("/verify-email?error=no_code", url.origin));
}
