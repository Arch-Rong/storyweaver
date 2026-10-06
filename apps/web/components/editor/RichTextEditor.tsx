"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center text-muted-foreground">
        编辑器加载中…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div
        className="flex flex-wrap gap-1.5 border-b border-border bg-card/90 px-3 py-2.5"
        role="toolbar"
        aria-label="文本格式"
      >
        {[
          { label: "粗体", active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
          { label: "斜体", active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
          {
            label: "小节标题",
            active: editor.isActive("heading", { level: 2 }),
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          },
          {
            label: "引用",
            active: editor.isActive("blockquote"),
            action: () => editor.chain().focus().toggleBlockquote().run(),
          },
        ].map((item) => (
          <Button
            key={item.label}
            type="button"
            variant={item.active ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 rounded-full px-3 text-xs", item.active && "bg-secondary")}
            onClick={item.action}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} className="min-h-[28rem]" />
    </div>
  );
}
