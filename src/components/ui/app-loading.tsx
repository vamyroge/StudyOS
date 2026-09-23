import { useLoading } from "@/hooks/use-loading";
import { Loader2 } from "lucide-react";

export function AppLoading() {
  const { loading } = useLoading();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/90 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      )}
    </div>
  );
}
