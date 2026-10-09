"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, PointerEvent } from "react";

import { DefaultBookCover, getDefaultCoverVariant } from "@/components/home/DefaultBookCover";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, type ProjectSummary } from "@/lib/novel-store";
import { getEditorPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

type BookCardProps = {
  project: ProjectSummary;
  onEdit?: (project: ProjectSummary) => void;
  onDelete?: (project: ProjectSummary) => void;
};

export function BookCard({ project, onEdit, onDelete }: BookCardProps) {
  const coverVariant = getDefaultCoverVariant(project.id);
  const hasCover = Boolean(project.coverUrl);
  const hasActions = Boolean(onEdit || onDelete);
  const editorPath = getEditorPath(project.id);

  function stopCardNavigation(event: MouseEvent | PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="book-card-wrap group/wrap relative">
      {hasActions ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="book-card-menu absolute top-1 right-1 z-20 size-7 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover/wrap:opacity-100 data-[state=open]:opacity-100"
              aria-label={`${project.title} 更多操作`}
              onPointerDown={stopCardNavigation}
              onClick={stopCardNavigation}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="size-4" />
                编辑信息
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="size-4" />
                删除作品
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Link
        href={editorPath}
        className="book-card group relative z-0 block cursor-pointer"
        aria-label={`打开作品：${project.title}`}
      >
        <div className="book-stage">
          <div className="book-body">
            <div className="book-cover-shell">
              <div
                className={cn("book-spine-strip", !hasCover && coverVariant)}
                aria-hidden="true"
              />

              {hasCover ? (
                <div className="book-cover-image-wrap">
                  <img src={project.coverUrl} alt={project.title} className="book-cover-image" />
                </div>
              ) : (
                <DefaultBookCover
                  title={project.title}
                  synopsis={project.synopsis}
                  chapterCount={project.chapterCount}
                  variant={coverVariant}
                />
              )}
            </div>
          </div>

          <div className="book-ground" aria-hidden="true" />
        </div>

        <div className="book-meta">
          <p className="book-meta-title">{project.title}</p>
          <p className="book-meta-stats">
            {project.chapterCount} 章 · {project.wordCount.toLocaleString()} 字 ·{" "}
            {formatRelativeTime(project.updatedAt)}
          </p>
        </div>
      </Link>
    </div>
  );
}
