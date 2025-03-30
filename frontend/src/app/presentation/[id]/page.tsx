"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RoleManagement from "@/components/RoleManagement";
import { useWebSocket } from "@/app/context/WebSocketContext";
import Slide from "@/components/Slide"; // Ensure this component exists
import { useUserStore } from "@/lib/store";
import PresentationUsers from "@/components/PresentationUsers"; // Ensure this component exists

type User = {
  id: string;
  nickname: string;
  role: "viewer" | "editor" | "creator";
};

export default function PresentationPage() {
  const { sendMessage, socket } = useWebSocket();
  const { nickname } = useUserStore(); // Use global store
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { id } = useParams();
  const presentationId = id ? String(id) : ""; // Ensure it's always a string

  useEffect(() => {
    if (!socket || !presentationId) return;

    const userId = localStorage.getItem("userId") || crypto.randomUUID();
    localStorage.setItem("userId", userId);

    setCurrentUser((prev) => prev ?? { id: userId, nickname: nickname || "Guest", role: "viewer" });

    // Ensure "join_presentation" is only sent **once per session**
    socket.send(JSON.stringify({ type: "join_presentation", userId, nickname, presentationId }));
  }, [socket, presentationId]); // 👈 Removed sendMessage and nickname to prevent unnecessary re-runs

  if (!currentUser) return <p>Loading...</p>;

  return (
    <div className="flex h-screen">
      {/* Left Panel (Slides) */}
      <div className="w-3/4 bg-white p-4">
        <h1 className="text-xl font-bold">Presentation {presentationId}</h1>
        <Slide slideId={presentationId} userRole={currentUser.role} />
      </div>

      {/* Right Panel (Users & Roles) */}
      <div className="w-1/4 bg-gray-100 p-4">
        <RoleManagement presentationId={presentationId} currentUser={currentUser} />
      </div>
    </div>
  );
}
