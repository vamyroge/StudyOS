"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Flag } from "lucide-react";
import { moderateSubmission } from "./actions";

export function ModerationActions({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleModeration(decision: "approved" | "rejected" | "flagged") {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("submissionId", submissionId);
      formData.set("decision", decision);
      const response = await moderateSubmission(formData);
      if (response.error) {
        setResult(response.error);
      } else {
        setResult(`${decision.toUpperCase()}`);
      }
    } catch {
      setResult("Error");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return <span className="text-sm text-muted-foreground">{result}</span>;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleModeration("approved")}
        disabled={loading}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleModeration("rejected")}
        disabled={loading}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleModeration("flagged")}
        disabled={loading}
      >
        <Flag className="h-4 w-4" />
      </Button>
    </div>
  );
}
