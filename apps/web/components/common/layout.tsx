"use client";

import { type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  header: ReactNode;
  children: ReactNode;
  variant?: "default" | "fill";
  className?: string;
  contentClassName?: string;
};

export function AppLayout({
  header,
  children,
  variant = "default",
  className,
  contentClassName,
}: AppLayoutProps) {
  if (variant === "fill") {
    return (
      <div className={cn("grid min-h-screen grid-rows-[auto_1fr] bg-background", className)}>
        {header}
        <div className={cn("min-h-0", contentClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {header}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

type AppLoadingProps = {
  message: string;
};

export function AppLoading({ message }: AppLoadingProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

type GuestLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function GuestLayout({ children, footer }: GuestLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 glow-top" aria-hidden="true" />

      <header className="relative z-10 flex justify-end px-6 py-5 sm:px-8">
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      {footer ? <footer className="relative z-10 px-6 pb-8 text-center">{footer}</footer> : null}
    </div>
  );
}
