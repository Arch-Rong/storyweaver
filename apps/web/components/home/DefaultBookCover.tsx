"use client";

import { cn } from "@/lib/utils";

const COVER_VARIANTS = [
  "default-cover-1",
  "default-cover-2",
  "default-cover-3",
  "default-cover-4",
  "default-cover-5",
] as const;

export function getDefaultCoverVariant(id: string): (typeof COVER_VARIANTS)[number] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash += id.charCodeAt(i);
  }
  return COVER_VARIANTS[hash % COVER_VARIANTS.length] ?? "default-cover-1";
}

type DefaultBookCoverProps = {
  title: string;
  synopsis?: string;
  chapterCount: number;
  variant: (typeof COVER_VARIANTS)[number];
};

export function DefaultBookCover({
  title,
  synopsis,
  chapterCount,
  variant,
}: DefaultBookCoverProps) {
  const accentChar = title.trim().charAt(0) || "书";

  return (
    <div className={cn("default-book-cover border border-red-300!", variant)}>
      {/* <div className="default-book-top">
        <div className="default-book-decor" aria-hidden="true">
          <span className="default-book-decor-a" />
          <span className="default-book-decor-b" />
          <span className="default-book-decor-c" />
          <span className="default-book-decor-d" />
        </div>

        <p className="default-book-vertical" aria-hidden="true">{accentChar}</p>

        <div className="default-book-heading">
          <h3 className="default-book-title">{title}</h3>
          <p className="default-book-subtitle">原创小说</p>
        </div>
      </div> */}

      {/* <div className="default-book-divider" aria-hidden="true" /> */}
{/*
      <div className="default-book-bottom">
        <p className="default-book-desc">
          {synopsis?.trim() ? `「${synopsis.trim()}」` : "开始写下你的第一行文字"}
        </p>
        <p className="default-book-foot">
          <span>StoryWeaver</span>
          <span>{chapterCount} 章</span>
        </p>
      </div> */}
    </div>
  );
}
