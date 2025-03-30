import React, { useState, useEffect } from "react";
import { useWebSocket } from "@/app/context/WebSocketContext";
import TextBlock from "@/components/TextBlock";
import axios from "axios";
type TextBlockType = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SlideProps = {
  slideId: string;
  userRole: "viewer" | "editor" | "creator";
};

export default function Slide({ slideId, userRole }: SlideProps) {
  const { sendMessage, lastMessage } = useWebSocket();
  const [textBlocks, setTextBlocks] = useState<TextBlockType[]>([]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/slide-elements/${slideId}`)
      .then((res) => setTextBlocks(res.data)) // Store elements correctly
      .catch((err) => console.error("Error fetching slide elements:", err));
  }, [slideId]);

  useEffect(() => {
    if (!lastMessage) return;

    const message = JSON.parse(lastMessage.data);

    setTextBlocks((prev) => {
      if (message.type === "text_block_added") {
        // Prevent duplicate blocks
        if (prev.some((block) => block.id === message.newTextBlock.id)) return prev;
        return [...prev, message.newTextBlock];
      }

      if (message.type === "text_block_updated") {
        return prev.map((block) => (block.id === message.id ? { ...block, ...message } : block));
      }

      return prev;
    });
  }, [lastMessage]); // Only run when new WebSocket message arrives

  const addTextBlock = () => {
    if (userRole === "viewer") return; // Viewers cannot add text blocks

    const newTextBlock: TextBlockType = {
      id: Date.now().toString(),
      content: "Double-click to edit...",
      x: 50,
      y: 50,
      width: 200,
      height: 100,
    };

    setTextBlocks((prev) => [...prev, newTextBlock]);
    sendMessage({ type: "add_text_block", slideId, newTextBlock });
  };

  return (
    <div className="relative w-full h-full bg-gray-200">
      {userRole !== "viewer" && (
        <button onClick={addTextBlock} className="absolute top-2 left-2 bg-blue-500 text-white px-4 py-2 rounded">
          Add Text Block
        </button>
      )}
      {textBlocks.map((block, index) => (
        <TextBlock
          key={index}
          id={block.id}
          slideId={slideId}
          initialText={block.content}
          initialX={block.x}
          initialY={block.y}
          initialWidth={block.width}
          initialHeight={block.height}
          isEditable={userRole !== "viewer"} // Allow editing for editors & creators
        />
      ))}
    </div>
  );
}
