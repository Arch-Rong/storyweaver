"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Quote } from "lucide-react";
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
      <div className="space-y-3 py-4">
        <div className="loading-pulse h-8 w-40" />
        <div className="loading-pulse h-4 w-full" />
        <div className="loading-pulse h-4 w-5/6" />
        <div className="loading-pulse h-4 w-4/6" />
      </div>
    );
  }

  return (
    <div className="editor-immersive overflow-hidden rounded-lg">
      <div
        className="editor-toolbar flex flex-wrap gap-0.5 px-2 py-1.5"
        role="toolbar"
        aria-label="文本格式"
      >
        {[
          {
            label: "粗体",
            icon: Bold,
            active: editor.isActive("bold"),
            action: () => editor.chain().focus().toggleBold().run(),
          },
          {
            label: "斜体",
            icon: Italic,
            active: editor.isActive("italic"),
            action: () => editor.chain().focus().toggleItalic().run(),
          },
          {
            label: "小节标题",
            icon: Heading2,
            active: editor.isActive("heading", { level: 2 }),
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          },
          {
            label: "引用",
            icon: Quote,
            active: editor.isActive("blockquote"),
            action: () => editor.chain().focus().toggleBlockquote().run(),
          },
        ].map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 text-muted-foreground",
              item.active && "bg-accent text-primary hover:bg-accent hover:text-primary",
            )}
            aria-label={item.label}
            title={item.label}
            onClick={item.action}
          >
            <item.icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} className="min-h-[32rem]" />
    </div>
  );
}
