import { cn } from "@/lib/utils";

/** Compact brand mark used in headers and auth chrome. */
export function LogoMark({
  className,
  showBangla = true,
  size = "md",
}: {
  className?: string;
  showBangla?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 flex-col leading-tight text-slate-900",
        className
      )}
    >
      <span
        className={cn(
          "font-semibold tracking-tight",
          size === "sm" ? "text-sm" : "text-base sm:text-lg"
        )}
      >
        GramCity{" "}
        <span className="text-emerald-700">Express</span>
      </span>
      {showBangla ? (
        <span
          className={cn(
            "font-medium text-emerald-800/90",
            size === "sm" ? "text-[11px]" : "text-xs sm:text-sm"
          )}
        >
          গ্রামসিটি এক্সপ্রেস
        </span>
      ) : null}
    </span>
  );
}
