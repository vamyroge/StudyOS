import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function QuizResultLoading() {
  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <Card className="border-2 border-border/40">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="rounded-full p-6 bg-muted flex items-center justify-center">
                <Loader2 className="h-14 w-14 text-muted-foreground animate-spin" />
              </div>

              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded-md mx-auto" />
                <div className="h-4 w-96 bg-muted rounded-md mx-auto" />
              </div>

              <div className="h-16 w-32 bg-muted rounded-lg mx-auto" />

              <div className="h-4 w-40 bg-muted rounded-md mx-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </Card>
          ))}
        </div>

        {/* Overview Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </Card>

        {/* Questions Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
