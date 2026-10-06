"use client";

import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chapter } from "@/lib/novel-store";
import { cn } from "@/lib/utils";

type ChapterSidebarProps = {
  chapters: Chapter[];
  activeChapterId: string;
  collapsed: boolean;
  onSelect: (chapterId: string) => void;
  onAdd: () => void;
  onToggleCollapse: () => void;
};

export function ChapterSidebar({
  chapters,
  activeChapterId,
  collapsed,
  onSelect,
  onAdd,
  onToggleCollapse,
}: ChapterSidebarProps) {
  return (
    <aside
      className={cn(
        "surface-subtle flex min-h-0 flex-col border-r border-border transition-[width] duration-200",
        collapsed ? "w-11" : "w-full",
      )}
    >
      <div
        className={cn(
          "flex items-center py-3",
          collapsed ? "justify-center px-1" : "justify-between px-3",
        )}
      >
        {!collapsed ? (
          <h2 className="text-xs font-medium text-muted-foreground">章节</h2>
        ) : null}
        <div className={cn("flex items-center gap-0.5", collapsed && "flex-col")}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "展开章节栏" : "收起章节栏"}
            title={collapsed ? "展开章节栏" : "收起章节栏"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
          {!collapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={onAdd}
              aria-label="新建章节"
              title="新建章节"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 px-1 pb-4">
        <ul className="space-y-0.5 px-1">
          {chapters.map((chapter, index) => {
            const active = chapter.id === activeChapterId;
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  title={collapsed ? chapter.title : undefined}
                  className={cn(
                    "flex w-full items-center rounded-md text-left transition-colors",
                    collapsed ? "justify-center px-1 py-2" : "gap-2.5 px-2.5 py-2",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  onClick={() => onSelect(chapter.id)}
                >
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center justify-center font-mono text-[10px] tabular-nums",
                      collapsed ? "h-6 w-6 rounded-md" : "h-4 w-4",
                      active ? "text-primary" : "text-muted-foreground/50",
                    )}
                  >
                    {index + 1}
                  </span>
                  {!collapsed ? (
                    <span className="truncate text-xs leading-snug">{chapter.title}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
