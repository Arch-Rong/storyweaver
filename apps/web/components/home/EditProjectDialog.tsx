"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectSummary } from "@/lib/novel-store";

type EditProjectDialogProps = {
  open: boolean;
  project: ProjectSummary | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { title: string; synopsis: string }) => void;
  pending?: boolean;
};

export function EditProjectDialog({
  open,
  project,
  onOpenChange,
  onSubmit,
  pending = false,
}: EditProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !project) {
      return;
    }
    setTitle(project.title);
    setSynopsis(project.synopsis);
    setError("");
  }, [open, project]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("请输入作品名称。");
      return;
    }

    onSubmit({
      title: trimmedTitle,
      synopsis: synopsis.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑作品信息</DialogTitle>
          <DialogDescription>修改书名与简介，封面可在编辑器中上传。</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-project-title" className="text-xs text-muted-foreground">
              作品名称
            </Label>
            <Input
              id="edit-project-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-project-synopsis" className="text-xs text-muted-foreground">
              作品简介
            </Label>
            <Textarea
              id="edit-project-synopsis"
              rows={3}
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
            />
          </div>

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
