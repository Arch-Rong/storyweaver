import { cn } from "@/lib/utils";

type StatusPillProps = {
  label: string;
  tone?: "default" | "active" | "muted";
  className?: string;
};

export function StatusPill({ label, tone = "default", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[11px] tabular-nums",
        tone === "active" && "text-highlight",
        tone === "muted" && "text-muted-foreground/50",
        tone === "default" && "text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "active" && "bg-highlight",
          tone === "muted" && "bg-muted-foreground/30",
          tone === "default" && "bg-muted-foreground/50",
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
