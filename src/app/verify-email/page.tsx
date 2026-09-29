"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, AlertCircle, Loader2 } from "lucide-react";
import { resendVerificationEmail } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";

type VerificationState = "checking" | "verified" | "pending" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function checkVerificationStatus() {
    const error = searchParams.get("error");
    
    if (error === "verification_failed") {
      setState("error");
      setErrorMessage("Xác minh email thất bại. Vui lòng thử lại.");
      return;
    }

    if (error === "no_code") {
      setState("error");
      setErrorMessage("Liên kết xác minh không hợp lệ.");
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User chưa có session (vừa signup, chưa verify)
      // Hiển thị pending state để user check email
      setState("pending");
      return;
    }

    if (user.email_confirmed_at) {
      setState("verified");
    } else {
      setState("pending");
    }
  }

  async function handleResendEmail() {
    if (resendCooldown > 0) return;
    
    setResending(true);
    setResendSuccess(false);
    setErrorMessage("");

    const result = await resendVerificationEmail();

    if ("error" in result) {
      setErrorMessage(result.error);
    } else {
      setResendSuccess(true);
      setResendCooldown(60);
    }

    setResending(false);
  }

  function handleContinue() {
    router.push("/dashboard");
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Đang kiểm tra...</h1>
              <p className="text-sm text-muted-foreground">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "verified") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center shadow-sm">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Xác minh email thành công</h1>
              <p className="text-sm text-muted-foreground">
                Email của bạn đã được xác minh. Tài khoản StudyOS đã sẵn sàng.
              </p>
            </div>
            <Button onClick={handleContinue} className="w-full" size="lg">
              Tiếp tục
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center shadow-sm">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kiểm tra email của bạn</h1>
              <p className="text-sm text-muted-foreground">
                Chúng tôi đã gửi email xác minh đến hộp thư của bạn. Vui lòng nhấp vào liên kết trong email để xác minh tài khoản.
              </p>
            </div>

            {resendSuccess && (
              <div className="w-full rounded-md bg-green-50 p-3 text-sm text-green-700">
                Email xác minh đã được gửi lại thành công!
              </div>
            )}

            {errorMessage && (
              <div className="w-full rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={handleResendEmail}
                disabled={resending || resendCooldown > 0}
                variant="outline"
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : resendCooldown > 0 ? (
                  `Gửi lại sau ${resendCooldown}s`
                ) : (
                  "Gửi lại email"
                )}
              </Button>
              <Button
                onClick={checkVerificationStatus}
                variant="ghost"
                className="w-full"
              >
                Tôi đã xác minh
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Không nhận được email? Kiểm tra hộp thư spam hoặc gửi lại email xác minh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center shadow-sm">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Đã xảy ra lỗi</h1>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "Không thể xác minh email. Vui lòng thử lại."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <Button
              onClick={handleResendEmail}
              disabled={resending || resendCooldown > 0}
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : resendCooldown > 0 ? (
                `Gửi lại sau ${resendCooldown}s`
              ) : (
                "Gửi lại email xác minh"
              )}
            </Button>
            <Button
              onClick={() => router.push("/register")}
              variant="outline"
              className="w-full"
            >
              Quay lại đăng ký
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Đang tải...</h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
