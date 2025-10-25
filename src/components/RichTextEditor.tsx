"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import ResizableImage from "tiptap-extension-resize-image";
import Video from "tiptap-extension-video";
import Resizable from "tiptap-extension-resizable";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onReady?: (editor: any) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  onReady,
  placeholder = "Start typing your email...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg cursor-pointer",
        },
      }),
      Video.configure({
        HTMLAttributes: {
          class: "rounded-lg cursor-pointer",
          controls: true,
        },
      }),
      Resizable.configure({
        types: ["image", "video"],
        handlerStyle: {
          width: "10px",
          height: "10px",
          background: "#4F46E5",
          border: "2px solid white",
          borderRadius: "50%",
        },
        layerStyle: {
          outline: "3px solid #4F46E5",
          outlineOffset: "2px",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }: any) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
  });

  // Expose editor to parent for toolbar controls
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border rounded-lg shadow-lg overflow-hidden bg-white">
      <style jsx global>{`
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #4F46E5;
          outline-offset: 2px;
        }

        .ProseMirror video {
          max-width: 100%;
          height: auto;
          cursor: pointer;
          border-radius: 0.5rem;
        }

        .ProseMirror video.ProseMirror-selectednode {
          outline: 3px solid #4F46E5;
          outline-offset: 2px;
        }

        /* Resize handle styles */
        .resize-trigger {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #4F46E5;
          border: 2px solid white;
          border-radius: 50%;
          cursor: nwse-resize;
          z-index: 10;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}
