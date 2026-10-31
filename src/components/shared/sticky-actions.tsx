"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StickyActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 p-4 backdrop-blur-sm md:static md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap gap-2">{children}</div>
    </div>
  );
}
