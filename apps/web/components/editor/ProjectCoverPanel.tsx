"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { type ChangeEvent, useRef } from "react";

import { DefaultBookCover, getDefaultCoverVariant } from "@/components/home/DefaultBookCover";
import { Button } from "@/components/ui/button";
import { readCoverFileAsDataUrl } from "@/lib/cover-image";
import type { NovelProject } from "@/lib/novel-store";
import { cn } from "@/lib/utils";

type ProjectCoverPanelProps = {
  project: NovelProject;
  onCoverChange: (coverUrl: string | null) => void;
};

export function ProjectCoverPanel({ project, onCoverChange }: ProjectCoverPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const coverVariant = getDefaultCoverVariant(project.id);
  const hasCover = Boolean(project.coverUrl);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readCoverFileAsDataUrl(file);
      onCoverChange(dataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "上传失败，请重试。";
      window.alert(message);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xs font-medium text-foreground">作品封面</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          上传 JPG / PNG / WebP，不超过 2MB。未上传时将使用默认封面。
        </p>
      </div>

      <div className="book-cover-preview">
        <div className="book-cover-preview-shell">
          <div className={cn("book-spine-strip", !hasCover && coverVariant)} aria-hidden="true" />
          {hasCover ? (
            <img src={project.coverUrl} alt={project.title} className="book-cover-preview-image" />
          ) : (
            <DefaultBookCover
              title={project.title}
              synopsis={project.synopsis}
              chapterCount={project.chapters.length}
              variant={coverVariant}
            />
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-3.5" />
          {hasCover ? "更换封面" : "上传封面"}
        </Button>
        {hasCover ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
            onClick={() => onCoverChange(null)}
          >
            <Trash2 className="size-3.5" />
            移除
          </Button>
        ) : null}
      </div>
    </div>
  );
}
