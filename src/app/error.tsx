"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="max-w-md text-center space-y-6 p-8 rounded-lg border bg-card shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Đã xảy ra lỗi</h1>
            <p className="text-muted-foreground">
              Xin lỗi, có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.
            </p>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-muted-foreground font-mono bg-muted p-3 rounded">
              {error.message}
            </div>
          )}
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
