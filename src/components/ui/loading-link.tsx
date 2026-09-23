"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoading } from "@/hooks/use-loading";
import { ComponentProps, MouseEvent } from "react";

type LoadingLinkProps = ComponentProps<typeof Link>;

export function LoadingLink({ href, onClick, ...props }: LoadingLinkProps) {
  const router = useRouter();
  const { addLoading } = useLoading();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    onClick?.(e);

    // Don't interfere with modified clicks (cmd/ctrl + click, etc)
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (e.nativeEvent && e.nativeEvent.button !== 0)
    ) {
      return;
    }

    // Trigger loading overlay immediately
    addLoading();

    // For external links or hash links, don't interfere
    const url = href.toString();
    if (url.startsWith('http') || url.startsWith('#')) {
      return;
    }

    // Prevent default and manually navigate
    e.preventDefault();
    router.push(url);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
