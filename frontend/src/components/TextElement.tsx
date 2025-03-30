"use client";

import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import ReactMarkdown from "react-markdown";

export default function TextElement({ element, onUpdate, editable }: { element: any; onUpdate: (id: string, updates: any) => void; editable: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(element.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(element.id, { content });
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  return (
    <Rnd
      position={{ x: element.x, y: element.y }}
      size={{ width: element.width || 200, height: element.height || 100 }}
      onDragStop={(_, data) => onUpdate(element.id, { x: data.x, y: data.y })}
      onResizeStop={(_, __, ref, ___, position) => {
        onUpdate(element.id, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          ...position,
        });
      }}
      disableDragging={!editable}
      enableResizing={editable}
      className="z-10"
    >
      {isEditing && editable ? (
        <textarea ref={textareaRef} className="w-full h-full p-2 border-none outline-none resize-none bg-transparent" value={content} onChange={(e) => setContent(e.target.value)} onBlur={handleBlur} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleBlur()} />
      ) : (
        <div className="w-full h-full p-2 cursor-text" onDoubleClick={() => editable && setIsEditing(true)} style={element.style}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </Rnd>
  );
}
