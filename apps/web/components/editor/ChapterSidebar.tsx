"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Chapter } from "@/lib/novel-store";
import { cn } from "@/lib/utils";

type ChapterSidebarProps = {
  chapters: Chapter[];
  activeChapterId: string;
  onSelect: (chapterId: string) => void;
  onAdd: () => void;
};

export function ChapterSidebar({
  chapters,
  activeChapterId,
  onSelect,
  onAdd,
}: ChapterSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-card/70">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <h2 className="text-sm font-semibold">章节</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          新建
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 pb-4">
        <ul className="space-y-1 p-2">
          {chapters.map((chapter, index) => {
            const active = chapter.id === activeChapterId;
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  className={cn(
                    "grid w-full grid-cols-[auto_1fr] items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border border-secondary bg-card"
                      : "border border-transparent hover:bg-card/80",
                  )}
                  onClick={() => onSelect(chapter.id)}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-snug">{chapter.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
