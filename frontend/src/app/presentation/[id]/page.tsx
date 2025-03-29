"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import RoleManagement from "@/components/RoleManagement";
import { useWebSocket } from "@/app/context/WebSocketContext";

type User = {
  id: string;
  nickname: string;
  role: "viewer" | "editor" | "creator";
};

export default function PresentationPage() {
  const { sendMessage, socket } = useWebSocket();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { id } = useParams();
  const presentationId = id ? String(id) : ""; // Ensure it's always a string

  useEffect(() => {
    if (!socket) return;

    const nickname = localStorage.getItem("nickname") || "Guest";
    const userId = localStorage.getItem("userId") || crypto.randomUUID();

    setCurrentUser({ id: userId, nickname, role: "viewer" });

    sendMessage({ type: "join_presentation", userId, nickname, presentationId });
  }, [socket, sendMessage, presentationId]);

  if (!currentUser) return <p>Loading...</p>;

  return (
    <div className="flex">
      {/* Left Panel (Slides) */}
      <div className="w-3/4 bg-white p-4">
        <h1 className="text-xl font-bold">Presentation {presentationId}</h1>
        {/* Slide content here */}
      </div>

      {/* Right Panel (Users & Roles) */}
      <div className="w-1/4 bg-gray-100 p-4">{presentationId && <RoleManagement presentationId={presentationId} currentUser={currentUser} />}</div>
    </div>
  );
}
