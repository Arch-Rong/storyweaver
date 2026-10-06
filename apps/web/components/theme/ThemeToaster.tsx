"use client";

import { Toaster } from "@/components/ui/sonner";

import { useTheme } from "./ThemeProvider";

export function ThemeToaster() {
  const { theme } = useTheme();

  return <Toaster theme={theme} closeButton position="top-center" />;
}
