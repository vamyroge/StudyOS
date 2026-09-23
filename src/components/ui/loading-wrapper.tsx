"use client";

import { LoadingProvider } from "@/hooks/use-loading";
import { AppLoading } from "@/components/ui/app-loading";
import { ReactNode } from "react";

interface LoadingWrapperProps {
  children: ReactNode;
}

export function LoadingWrapper({ children }: LoadingWrapperProps) {
  return (
    <LoadingProvider>
      {children}
      <AppLoading />
    </LoadingProvider>
  );
}
