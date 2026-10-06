"use client";

import { ChevronDown, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BookCard } from "@/components/home/BookCard";
import { CreateProjectDialog } from "@/components/home/CreateProjectDialog";
import { EditProjectDialog } from "@/components/home/EditProjectDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
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
import { clearSession, readSessionFromStorage, type SessionUser } from "@/lib/auth";
import {
  createProject,
  deleteProject,
  listProjectSummaries,
  updateProjectMeta,
  type ProjectSummary,
} from "@/lib/novel-store";

export function HomeWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectSummary | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const session = readSessionFromStorage();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
    setProjects(listProjectSummaries(session.username));
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const username = user.username;

    function refreshProjects() {
      setProjects(listProjectSummaries(username));
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshProjects();
      }
    }

    window.addEventListener("focus", refreshProjects);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshProjects);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  function refreshProjects() {
    if (!user) {
      return;
    }
    setProjects(listProjectSummaries(user.username));
  }

  function handleCreateSubmit(input: { title: string; synopsis: string }) {
    if (!user) {
      return;
    }

    setCreating(true);
    const project = createProject(user.username, input);
    setCreateOpen(false);
    setCreating(false);
    router.push(`/editor/${project.id}`);
  }

  function handleEditSubmit(input: { title: string; synopsis: string }) {
    if (!user || !editingProject) {
      return;
    }

    setSavingEdit(true);
    updateProjectMeta(user.username, editingProject.id, input);
    setEditingProject(null);
    setSavingEdit(false);
    refreshProjects();
  }

  function handleDeleteConfirm() {
    if (!user || !deletingProject) {
      return;
    }

    deleteProject(user.username, deletingProject.id);
    setDeletingProject(null);
    refreshProjects();
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">正在加载书架…</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="glass-toolbar flex items-center justify-between gap-4 px-5 py-2.5 sm:px-8">
          <p className="text-xs font-medium tracking-widest text-primary">STORYWEAVER</p>
          <div className="flex items-center gap-2.5">
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

        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-medium tracking-tight text-foreground">我的书架</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {projects.length} 部作品 · 点击书本进入编辑
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              新建作品
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
              <p className="text-sm text-muted-foreground">书架还是空的</p>
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                创建第一部作品
              </Button>
            </div>
          ) : (
            <div className="bookshelf-panel">
              <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
                {projects.map((project) => (
                  <li key={project.id} className="bookshelf-slot">
                    <BookCard
                      project={project}
                      onEdit={setEditingProject}
                      onDelete={setDeletingProject}
                    />
                  </li>
                ))}

                <li className="bookshelf-slot">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="book-card-new group"
                    aria-label="新建作品"
                  >
                    <div className="book-card-new-inner">
                      <Plus className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
                      <span className="mt-2 text-xs text-muted-foreground transition-colors group-hover:text-primary">
                        新建作品
                      </span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </main>
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateSubmit}
        pending={creating}
      />

      <EditProjectDialog
        open={Boolean(editingProject)}
        project={editingProject}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProject(null);
          }
        }}
        onSubmit={handleEditSubmit}
        pending={savingEdit}
      />

      <Dialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProject(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除「{deletingProject?.title}」？</DialogTitle>
            <DialogDescription>
              删除后无法恢复，包括所有章节与本地草稿。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
