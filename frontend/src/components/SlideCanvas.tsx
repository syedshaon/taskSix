"use client";

import { useEffect, useRef } from "react";
import TextElement from "./TextElement";
import ShapeElement from "./Shape";
import ImageElement from "./ImageElement";

export default function SlideCanvas({ elements, activeTool, onAddElement, onUpdateElement, isPresenterMode }: { elements: any[]; activeTool: string | null; onAddElement: (element: any) => void; onUpdateElement: (id: string, updates: any) => void; isPresenterMode: boolean }) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!activeTool || isPresenterMode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (activeTool) {
      case "text":
        onAddElement({
          type: "text",
          x,
          y,
          content: "Double click to edit",
          style: { fontSize: "16px", color: "#000000" },
        });
        break;
      case "rectangle":
        onAddElement({
          type: "shape",
          shape: "rectangle",
          x,
          y,
          width: 100,
          height: 60,
          style: { fill: "#ffffff", stroke: "#000000" },
        });
        break;
      // Add cases for other tools
    }
  };

  return (
    <div ref={canvasRef} className={`w-full h-full ${isPresenterMode ? "bg-black" : "bg-white"}`} onClick={handleCanvasClick}>
      {elements.map((element) => {
        switch (element.type) {
          case "text":
            return <TextElement key={element.id} element={element} onUpdate={onUpdateElement} editable={!isPresenterMode} />;
          case "shape":
            return <ShapeElement key={element.id} type={element.shape} x={element.x} y={element.y} width={element.width} height={element.height} color={element.style.fill} />;
          case "image":
            return <ImageElement key={element.id} element={element} onUpdate={onUpdateElement} editable={!isPresenterMode} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
