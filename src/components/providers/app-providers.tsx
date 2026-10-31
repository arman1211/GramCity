"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast:
              "border border-border bg-card text-foreground shadow-sm",
            success: "text-emerald-800",
            error: "text-red-800",
          },
        }}
        closeButton
        richColors={false}
      />
    </>
  );
}
