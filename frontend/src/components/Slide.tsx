"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/app/context/WebSocketContext";
import TextBlock from "@/components/TextBlock";
import Shape from "@/components/Shape"; // New component for shapes

type SlideProps = {
  slideId: string;
  userRole: "viewer" | "editor" | "creator" | "admin";
  activeTool: string | null;
  onContentAdded: (content: any) => void;
};

export default function Slide({ slideId, userRole, activeTool, onContentAdded }: SlideProps) {
  const [elements, setElements] = useState<any[]>([]);
  const { sendMessage, lastMessage } = useWebSocket();

  useEffect(() => {
    // Load existing elements
    // This would fetch from your API
  }, [slideId]);

  useEffect(() => {
    if (!lastMessage) return;
    // Handle WebSocket updates for elements
  }, [lastMessage]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (userRole === "viewer" || !activeTool) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement = {
      id: Date.now().toString(),
      type: activeTool,
      x,
      y,
      // Other properties based on the tool
    };

    setElements((prev) => [...prev, newElement]);
    onContentAdded(newElement);
  };

  return (
    <div className="w-full h-full bg-white relative overflow-hidden" onClick={handleCanvasClick}>
      {elements.map((element) => {
        switch (element.type) {
          case "text":
            return <TextBlock key={element.id} id={element.id} slideId={slideId} initialText={element.content || "New text"} initialX={element.x} initialY={element.y} initialWidth={element.width || 100} initialHeight={element.height || 50} isEditable={userRole !== "viewer"} />;
          case "rectangle":
          case "circle":
          case "arrow":
            return <Shape key={element.id} type={element.type} x={element.x} y={element.y} width={element.width || 100} height={element.height || 100} color={element.color || "#000000"} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
