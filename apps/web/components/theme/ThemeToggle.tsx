"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-7 w-7"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "切换为白天模式" : "切换为暗黑模式"}
      title={theme === "dark" ? "白天模式" : "暗黑模式"}
    >
      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  );
}
