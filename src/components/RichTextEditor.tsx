"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import ResizableImage from "tiptap-extension-resize-image";
import Video from "tiptap-extension-video";
import Resizable from "tiptap-extension-resizable";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Trash2,
  Type,
} from "lucide-react";

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
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showAltInput, setShowAltInput] = useState(false);
  const [altText, setAltText] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Ensure BubbleMenu only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      TextAlign.configure({
        types: ["heading", "paragraph"],
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

  // Helper to check if image or video is selected
  const isMediaSelected = () => {
    if (!editor) return false;
    const { state } = editor;
    const { selection } = state;
    const node = selection.$from.node();
    return node?.type.name === "image" || node?.type.name === "video";
  };

  // Handle image alignment
  const setAlignment = (align: "left" | "center" | "right") => {
    try {
      if (!editor?.state?.selection?.$from) return;
      const { state } = editor;
      const { selection } = state;
      const node = selection.$from.node();

      if (node?.type?.name === "image" || node?.type?.name === "video") {
        const marginStyle = align === "center"
          ? "left: auto; margin-right: auto"
          : align === "right"
          ? "left: auto; margin-right: 0"
          : "left: 0; margin-right: auto";

        editor
          .chain()
          .focus()
          .updateAttributes(node.type.name, {
            style: `display: block; margin-${marginStyle}`,
          })
          .run();
      }
    } catch (error) {
      console.error("Error setting alignment:", error);
    }
  };

  // Handle adding link to image
  const handleAddLink = () => {
    try {
      if (!linkUrl || !editor?.state?.selection?.$from) return;

      const { state } = editor;
      const { selection } = state;
      const node = selection.$from.node();

      if (node?.type?.name === "image" || node?.type?.name === "video") {
        // Wrap the media in a link
        const mediaHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${state.doc.textContent}</a>`;
        editor.chain().focus().insertContent(mediaHtml).run();
        setShowLinkInput(false);
        setLinkUrl("");
      }
    } catch (error) {
      console.error("Error adding link:", error);
    }
  };

  // Handle adding alt text
  const handleAddAltText = () => {
    try {
      if (!altText || !editor?.state?.selection?.$from) return;

      const { state } = editor;
      const { selection } = state;
      const node = selection.$from.node();

      if (node?.type?.name === "image") {
        editor
          .chain()
          .focus()
          .updateAttributes("image", { alt: altText })
          .run();
        setShowAltInput(false);
        setAltText("");
      }
    } catch (error) {
      console.error("Error adding alt text:", error);
    }
  };

  // Handle deleting media
  const handleDelete = () => {
    try {
      if (!editor) return;
      editor.chain().focus().deleteSelection().run();
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg shadow-lg overflow-hidden bg-white">
      {/* Bubble Menu for Images/Videos */}
      {isMounted && editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor, state }) => {
            try {
              if (!state?.selection?.$from) return false;
              const node = state.selection.$from.node();
              return node?.type?.name === "image" || node?.type?.name === "video";
            } catch (error) {
              return false;
            }
          }}
        >
          <div className="flex items-center gap-1 bg-gray-900 text-white rounded-lg p-2 shadow-lg">
            {/* Alignment Controls */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAlignment("left")}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAlignment("center")}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAlignment("right")}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-600 mx-1" />

            {/* Link Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            {/* Alt Text Button (Images only) */}
            {editor?.state?.selection?.$from?.node()?.type?.name === "image" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAltInput(!showAltInput)}
                className="h-8 w-8 p-0 hover:bg-gray-700"
                title="Add Alt Text"
              >
                <Type className="h-4 w-4" />
              </Button>
            )}

            <div className="w-px h-6 bg-gray-600 mx-1" />

            {/* Delete Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Link Input */}
            {showLinkInput && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="url"
                  placeholder="Enter URL"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddLink()}
                  className="h-8 w-48 text-sm bg-gray-800 border-gray-600"
                />
                <Button
                  size="sm"
                  onClick={handleAddLink}
                  className="h-8"
                >
                  Add
                </Button>
              </div>
            )}

            {/* Alt Text Input */}
            {showAltInput && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="text"
                  placeholder="Alt text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddAltText()}
                  className="h-8 w-48 text-sm bg-gray-800 border-gray-600"
                />
                <Button
                  size="sm"
                  onClick={handleAddAltText}
                  className="h-8"
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </BubbleMenu>
      )}

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
