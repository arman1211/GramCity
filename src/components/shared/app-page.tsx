"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AppPage({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl space-y-6 px-4 py-6 md:py-8", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
