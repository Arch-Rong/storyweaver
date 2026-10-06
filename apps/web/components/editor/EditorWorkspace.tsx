"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { clearSession, readSessionFromStorage, type SessionUser } from "@/lib/auth";
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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [project, setProject] = useState<NovelProject | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [logoutOpen, setLogoutOpen] = useState(false);
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
    const session = readSessionFromStorage();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
    const loaded = loadProject(session.username, projectId);
    if (!loaded) {
      router.replace("/home");
      return;
    }
    setProject(loaded);
  }, [projectId, router]);

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

  function handleLogout() {
    clearSession();
    router.replace("/login");
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

  if (!user || !project || !activeChapter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">正在打开编辑器…</p>
      </div>
    );
  }

  const saveLabel =
    saveState === "saving" ? "保存中" : saveState === "saved" ? "已保存" : "未保存";
  const saveTone =
    saveState === "saved" ? "active" : saveState === "saving" ? "default" : "muted";

  return (
    <>
      <div className="grid min-h-screen grid-rows-[auto_1fr] bg-background">
        <header className="glass-toolbar flex flex-wrap items-center justify-between gap-4 px-5 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              href="/home"
              className="shrink-0 text-xs font-medium tracking-widest text-primary transition-colors hover:text-primary/80"
            >
              StoryWeaver
            </Link>
            <div className="h-3.5 w-px bg-border" aria-hidden="true" />
            <Input
              className="max-w-sm border-none bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              value={project.title}
              placeholder="未命名作品"
              onChange={(event) =>
                updateProject((current) => ({ ...current, title: event.target.value }))
              }
              aria-label="作品标题"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {wordCount.toLocaleString()} 字
            </span>
            <StatusPill label={saveLabel} tone={saveTone} />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 px-2.5">
                  {user.displayName}
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>当前账号</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                  <LogOut className="size-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div
          className={cn(
            "grid min-h-0",
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
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出？</DialogTitle>
            <DialogDescription>
              退出后本地草稿仍会保留。下次用相同用户名登录即可继续编辑。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              取消
            </Button>
            <Button onClick={handleLogout}>退出登录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
