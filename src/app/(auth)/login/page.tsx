"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useLoading } from "@/hooks/use-loading";
import { login } from "../actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addLoading, removeLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registered = searchParams.get("registered");

  // Remove loading overlay when page is ready
  useEffect(() => {
    removeLoading();
  }, [removeLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    addLoading();
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      const result = await login(formData);
      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        removeLoading();
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
      removeLoading();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Brain className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">Truy cập StudyOS</p>
      </div>

      {registered && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700" role="alert">
          Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
