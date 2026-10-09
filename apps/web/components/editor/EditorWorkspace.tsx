"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Header } from "@/components/common/Header";
import { AppLayout, AppLoading } from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import {
  addChapter,
  countWords,
  loadProject,
  saveProject,
  type NovelProject,
} from "@/lib/novel-store";
import { getSidebarCollapsed, setSidebarCollapsed } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";

import { ChapterSidebar } from "./ChapterSidebar";
import { ProjectCoverPanel } from "./ProjectCoverPanel";
import { RichTextEditor } from "./RichTextEditor";

type SaveState = "saved" | "saving" | "idle";

type EditorWorkspaceProps = {
  projectId: string;
};

export function EditorWorkspace({ projectId }: EditorWorkspaceProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const [project, setProject] = useState<NovelProject | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const lastToastAt = useRef(0);

  const activeChapter = useMemo(() => {
    if (!project) {
      return null;
    }
    return project.chapters.find((chapter) => chapter.id === project.activeChapterId) ?? null;
  }, [project]);

  const wordCount = useMemo(() => {
    if (!project) {
      return 0;
    }
    return project.chapters.reduce((total, chapter) => total + countWords(chapter.content), 0);
  }, [project]);

  const persist = useCallback(
    (nextProject: NovelProject) => {
      if (!user) {
        return;
      }
      setSaveState("saving");
      saveProject(user.username, nextProject);
      window.setTimeout(() => setSaveState("saved"), 250);
    },
    [user],
  );

  useEffect(() => {
    setSidebarCollapsedState(getSidebarCollapsed());
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsProjectLoading(true);
    const loaded = loadProject(user.username, projectId);
    if (!loaded) {
      setIsProjectLoading(false);
      router.replace("/home");
      return;
    }

    setProject(loaded);
    setIsProjectLoading(false);
  }, [projectId, router, user]);

  useEffect(() => {
    if (!user || !project) {
      return;
    }

    const timer = window.setTimeout(() => {
      persist(project);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [project, user, persist]);

  useEffect(() => {
    if (saveState !== "saved") {
      return;
    }

    const now = Date.now();
    if (now - lastToastAt.current < 1500) {
      return;
    }
    lastToastAt.current = now;
    toast.success("已保存到本地");
  }, [saveState]);

  function updateProject(updater: (current: NovelProject) => NovelProject) {
    setProject((current) => {
      if (!current) {
        return current;
      }
      return updater(current);
    });
    setSaveState("saving");
  }

  function handleAddChapter() {
    updateProject((current) => addChapter(current));
    toast.message("已新建章节");
  }

  function handleToggleSidebar() {
    setSidebarCollapsedState((current) => {
      const next = !current;
      setSidebarCollapsed(next);
      return next;
    });
  }

  if (isAuthLoading || isProjectLoading || !user || !project || !activeChapter) {
    return <AppLoading message="正在打开编辑器…" />;
  }

  const saveLabel =
    saveState === "saving" ? "保存中" : saveState === "saved" ? "已保存" : "未保存";
  const saveTone =
    saveState === "saved" ? "active" : saveState === "saving" ? "default" : "muted";

  return (
    <AppLayout
      variant="fill"
      header={
        <Header
          user={user}
          brandHref="/home"
          brandLabel="StoryWeaver"
          leading={
            <Input
              className="max-w-sm border-none bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              value={project.title}
              placeholder="未命名作品"
              onChange={(event) =>
                updateProject((current) => ({ ...current, title: event.target.value }))
              }
              aria-label="作品标题"
            />
          }
          trailing={
            <>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {wordCount.toLocaleString()} 字
              </span>
              <StatusPill label={saveLabel} tone={saveTone} />
            </>
          }
        />
      }
    >
      <div
        className={cn(
          "grid min-h-0 h-full",
          sidebarCollapsed
            ? "lg:grid-cols-[2.75rem_minmax(0,1fr)] xl:grid-cols-[2.75rem_minmax(0,1fr)_15rem]"
            : "lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_15rem]",
        )}
      >
          <ChapterSidebar
            chapters={project.chapters}
            activeChapterId={project.activeChapterId}
            collapsed={sidebarCollapsed}
            onSelect={(chapterId) =>
              updateProject((current) => ({ ...current, activeChapterId: chapterId }))
            }
            onAdd={handleAddChapter}
            onToggleCollapse={handleToggleSidebar}
          />

          <section className="min-w-0 overflow-auto px-6 py-10 lg:px-14 lg:py-14">
            <div className="mx-auto max-w-2xl space-y-8">
              <div className="space-y-4">
                <input
                  className="w-full border-none bg-transparent text-xl font-medium tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
                  value={activeChapter.title}
                  placeholder="章节标题"
                  onChange={(event) =>
                    updateProject((current) => ({
                      ...current,
                      chapters: current.chapters.map((chapter) =>
                        chapter.id === activeChapter.id
                          ? {
                              ...chapter,
                              title: event.target.value,
                              updatedAt: new Date().toISOString(),
                            }
                          : chapter,
                      ),
                    }))
                  }
                  aria-label="章节标题"
                />
                <Textarea
                  className="resize-none border-none bg-transparent px-0 text-sm leading-relaxed text-muted-foreground shadow-none focus-visible:ring-0"
                  value={project.synopsis}
                  placeholder="作品简介：一句话交代故事背景、主角与冲突……"
                  rows={2}
                  onChange={(event) =>
                    updateProject((current) => ({ ...current, synopsis: event.target.value }))
                  }
                />
              </div>

              <RichTextEditor
                content={activeChapter.content}
                onChange={(html) =>
                  updateProject((current) => ({
                    ...current,
                    chapters: current.chapters.map((chapter) =>
                      chapter.id === activeChapter.id
                        ? { ...chapter, content: html, updatedAt: new Date().toISOString() }
                        : chapter,
                    ),
                  }))
                }
              />
            </div>
          </section>

          <aside className="surface-subtle hidden flex-col gap-6 border-l border-border px-4 py-8 xl:flex">
            <ProjectCoverPanel
              project={project}
              onCoverChange={(coverUrl) =>
                updateProject((current) => ({
                  ...current,
                  coverUrl: coverUrl ?? undefined,
                }))
              }
            />

            <div className="h-px bg-border" aria-hidden="true" />

            <div>
              <h2 className="text-xs font-medium text-foreground">写作助手</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                规划、续写、改稿与一致性检查将在这里出现。
              </p>
            </div>
            <Card className="glass-panel border-none bg-transparent shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">可尝试的指令</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <li>根据简介生成前三章大纲</li>
                  <li>续写当前章节下一段</li>
                  <li>检查角色称谓是否前后一致</li>
                </ul>
              </CardContent>
            </Card>
          </aside>
      </div>
    </AppLayout>
  );
}
