"use client";

import { useEffect } from "react";
import { useLoading } from "@/hooks/use-loading";

export function PageLoaded() {
  const { removeLoading } = useLoading();

  useEffect(() => {
    // Remove loading overlay when page is mounted and rendered
    removeLoading();
  }, [removeLoading]);

  return null;
}
