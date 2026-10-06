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

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { title: string; synopsis: string }) => void;
  pending?: boolean;
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  pending = false,
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSynopsis("");
      setError("");
    }
  }, [open]);

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
          <DialogTitle>新建作品</DialogTitle>
          <DialogDescription>为你的新故事取一个名字，创建后即可开始写作。</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="project-title" className="text-xs text-muted-foreground">
              作品名称
            </Label>
            <Input
              id="project-title"
              placeholder="例如：星河旅人"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="project-synopsis" className="text-xs text-muted-foreground">
              作品简介
            </Label>
            <Textarea
              id="project-synopsis"
              placeholder="一句话介绍故事背景、主角与冲突……"
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
              {pending ? "创建中…" : "创建并写作"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
