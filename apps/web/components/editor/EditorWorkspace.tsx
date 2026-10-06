"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { clearSession, readSessionFromStorage, type SessionUser } from "@/lib/auth";
import {
  addChapter,
  countWords,
  loadProject,
  saveProject,
  type NovelProject,
} from "@/lib/novel-store";

import { ChapterSidebar } from "./ChapterSidebar";
import { RichTextEditor } from "./RichTextEditor";

type SaveState = "saved" | "saving" | "idle";

export function EditorWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [project, setProject] = useState<NovelProject | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [logoutOpen, setLogoutOpen] = useState(false);
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
    const session = readSessionFromStorage();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
    setProject(loadProject(session.username));
  }, [router]);

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

  if (!user || !project || !activeChapter) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        正在打开编辑器…
      </div>
    );
  }

  const saveLabel =
    saveState === "saving" ? "保存中…" : saveState === "saved" ? "已保存" : "等待编辑";

  return (
    <>
      <div className="grid min-h-screen grid-rows-[auto_1fr] bg-background">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/90 px-5 py-3.5 backdrop-blur-sm">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <p className="font-serif text-[0.95rem] text-primary">StoryWeaver</p>
            <Input
              className="max-w-sm border-transparent bg-transparent font-serif text-lg font-semibold shadow-none hover:border-input focus-visible:border-input"
              value={project.title}
              onChange={(event) =>
                updateProject((current) => ({ ...current, title: event.target.value }))
              }
              aria-label="作品标题"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{wordCount.toLocaleString()} 字</span>
            <span aria-hidden="true">·</span>
            <span>{saveLabel}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {user.displayName}
                  <ChevronDown className="size-3.5 opacity-60" />
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

        <div className="grid min-h-0 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
          <ChapterSidebar
            chapters={project.chapters}
            activeChapterId={project.activeChapterId}
            onSelect={(chapterId) =>
              updateProject((current) => ({ ...current, activeChapterId: chapterId }))
            }
            onAdd={handleAddChapter}
          />

          <section className="min-w-0 overflow-auto px-5 py-5 lg:px-6 lg:py-6">
            <div className="mb-4 max-w-3xl space-y-3">
              <input
                className="w-full border-none bg-transparent font-serif text-[1.65rem] font-semibold outline-none"
                value={activeChapter.title}
                onChange={(event) =>
                  updateProject((current) => ({
                    ...current,
                    chapters: current.chapters.map((chapter) =>
                      chapter.id === activeChapter.id
                        ? { ...chapter, title: event.target.value, updatedAt: new Date().toISOString() }
                        : chapter,
                    ),
                  }))
                }
                aria-label="章节标题"
              />
              <Textarea
                className="resize-y border-dashed bg-card/50 text-muted-foreground"
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
          </section>

          <aside className="hidden flex-col gap-4 border-l border-border bg-card/70 p-5 xl:flex">
            <div>
              <h2 className="text-sm font-semibold">写作助手</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                规划、续写、改稿与一致性检查将在这里出现。当前版本先把编辑器与章节结构跑通。
              </p>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  可尝试的指令
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed">
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
