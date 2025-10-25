declare module 'tiptap-extension-video' {
  import { Node } from '@tiptap/core';

  export interface VideoOptions {
    HTMLAttributes?: Record<string, any>;
  }

  const Video: Node<VideoOptions>;
  export default Video;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; HTMLAttributes?: Record<string, any> }) => ReturnType;
    };
  }
}

declare module 'tiptap-extension-resizable' {
  import { Extension } from '@tiptap/core';

  export interface ResizableOptions {
    types?: string[];
    handlerStyle?: Record<string, any>;
    layerStyle?: Record<string, any>;
  }

  const Resizable: Extension<ResizableOptions>;
  export default Resizable;
}
