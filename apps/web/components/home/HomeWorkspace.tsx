"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Header } from "@/components/common/Header";
import { AppLayout, AppLoading } from "@/components/common/layout";
import { PageHeader } from "@/components/common/PageHeader";
import { BookCard } from "@/components/home/BookCard";
import { CreateProjectDialog } from "@/components/home/CreateProjectDialog";
import { EditProjectDialog } from "@/components/home/EditProjectDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { getEditorPath } from "@/lib/paths";
import {
  createProject,
  deleteProject,
  listProjectSummaries,
  updateProjectMeta,
  type ProjectSummary,
} from "@/lib/novel-store";

export function HomeWorkspace() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectSummary | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setProjects(listProjectSummaries(user.username));
  }, [user]);

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
    router.push(getEditorPath(project.id));
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

  if (isLoading || !user) {
    return <AppLoading message="正在加载书架…" />;
  }

  return (
    <>
      <AppLayout header={<Header user={user} brandHref="/home" />}>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <PageHeader
            title="我的书架"
            description={`${projects.length} 部作品 · 点击书本进入编辑`}
            actions={
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-3.5" />
                新建作品
              </Button>
            }
          />

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
      </AppLayout>

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

    </>
  );
}
