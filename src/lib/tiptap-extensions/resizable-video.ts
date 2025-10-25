import Video from 'tiptap-extension-video';

export interface VideoOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

export const ResizableVideo = Video.extend({
  name: 'video',

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }: any) => {
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.maxWidth = '100%';

      const video = document.createElement('video');
      video.src = node.attrs.src;
      video.controls = node.attrs.controls !== false;
      video.style.display = 'block';
      video.style.maxWidth = '100%';
      video.style.height = 'auto';

      if (node.attrs.width) {
        video.style.width = node.attrs.width;
      }
      if (node.attrs.height) {
        video.style.height = node.attrs.height;
      }
      if (node.attrs.style) {
        video.setAttribute('style', video.getAttribute('style') + '; ' + node.attrs.style);
      }

      // Apply custom HTML attributes
      Object.keys(this.options.HTMLAttributes).forEach(key => {
        if (key === 'class') {
          video.className = this.options.HTMLAttributes[key];
        } else {
          video.setAttribute(key, this.options.HTMLAttributes[key]);
        }
      });

      // Resize handles
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;

      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.right = '-5px';
      resizeHandle.style.bottom = '-5px';
      resizeHandle.style.width = '10px';
      resizeHandle.style.height = '10px';
      resizeHandle.style.background = '#4F46E5';
      resizeHandle.style.border = '2px solid white';
      resizeHandle.style.borderRadius = '50%';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.display = 'none';
      resizeHandle.style.zIndex = '10';

      container.appendChild(video);
      container.appendChild(resizeHandle);

      // Show/hide resize handle on hover
      container.addEventListener('mouseenter', () => {
        if (editor.isEditable) {
          resizeHandle.style.display = 'block';
        }
      });

      container.addEventListener('mouseleave', () => {
        if (!isResizing) {
          resizeHandle.style.display = 'none';
        }
      });

      // Resize functionality
      const startResize = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = video.offsetWidth;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
      };

      const resize = (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;

        if (newWidth > 100 && newWidth <= container.parentElement!.offsetWidth) {
          video.style.width = `${newWidth}px`;
        }
      };

      const stopResize = () => {
        if (!isResizing) return;

        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);

        // Update the node attributes
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor.commands.updateAttributes('video', {
            width: video.style.width,
          });
        }

        resizeHandle.style.display = 'none';
      };

      resizeHandle.addEventListener('mousedown', startResize);

      return {
        dom: container,
        contentDOM: null,
        update: (updatedNode: any) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          video.src = updatedNode.attrs.src;
          if (updatedNode.attrs.width) {
            video.style.width = updatedNode.attrs.width;
          }
          if (updatedNode.attrs.height) {
            video.style.height = updatedNode.attrs.height;
          }
          if (updatedNode.attrs.style) {
            video.setAttribute('style', video.getAttribute('style')?.split(';')[0] + '; ' + updatedNode.attrs.style);
          }

          return true;
        },
        destroy: () => {
          resizeHandle.removeEventListener('mousedown', startResize);
        },
      };
    };
  },
});
