"use client";

import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import ReactMarkdown from "react-markdown";
import { useWebSocket } from "@/app/context/WebSocketContext";

type TextBlockProps = {
  id: string;
  slideId: string;
  initialText: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  isEditable: boolean; // ✅ Add this
};

export default function TextBlock({
  id,
  slideId,
  initialText,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  isEditable, // ✅ Receive this prop
}: TextBlockProps) {
  const { sendMessage } = useWebSocket();
  const [text, setText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });

  useEffect(() => {
    sendMessage({
      type: "update_text_block",
      id,
      slideId,
      content: text,
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });
  }, [text, position, size]);

  return (
    <Rnd
      position={position}
      size={size}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
        setPosition(position);
      }}
      className="border border-gray-400 bg-white p-2 shadow-md rounded-md cursor-move"
      disableDragging={!isEditable} // ✅ Disable drag for viewers
      enableResizing={isEditable} // ✅ Disable resize for viewers
    >
      {isEditing && isEditable ? ( // ✅ Only allow editing if `isEditable` is true
        <textarea className="w-full h-full p-2 border-none outline-none resize-none" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => setIsEditing(false)} autoFocus />
      ) : (
        <div onDoubleClick={() => isEditable && setIsEditing(true)} className="w-full h-full overflow-hidden">
          <div className="prose">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </div>
      )}
    </Rnd>
  );
}
