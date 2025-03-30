"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { useUserStore } from "@/lib/store";
import { FiUser, FiEdit2, FiEye } from "react-icons/fi";

type User = {
  id: string;
  nickname: string;
  role: "viewer" | "editor" | "creator";
  avatar?: string;
};

type UsersPanelProps = {
  presentationId: string;
  currentUser: string;
};

export default function UsersPanel({ presentationId, currentUser }: UsersPanelProps) {
  const { sendMessage, lastMessage } = useWebSocket();
  const { nickname } = useUserStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    // Initial load of connected users
    // In a real app, you'd fetch this from your API
    setUsers([
      {
        id: "1",
        nickname: nickname || "Guest",
        role: "creator", // Temporary - in real app this would come from backend
      },
    ]);
    setIsCreator(true); // Temporary - check actual role from backend
  }, [nickname]);

  useEffect(() => {
    if (!lastMessage) return;

    const message = JSON.parse(lastMessage.data);

    switch (message.type) {
      case "user_joined":
        setUsers((prev) => [...prev, message.user]);
        break;
      case "user_left":
        setUsers((prev) => prev.filter((u) => u.id !== message.userId));
        break;
      case "user_role_updated":
        setUsers((prev) => prev.map((u) => (u.id === message.userId ? { ...u, role: message.newRole } : u)));
        break;
    }
  }, [lastMessage]);

  const changeUserRole = (userId: string, newRole: "viewer" | "editor") => {
    if (!isCreator) return;

    sendMessage({
      type: "change_user_role",
      presentationId,
      userId,
      newRole,
    });
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Collaborators</h2>
        <p className="text-sm text-gray-500">{users.length} active</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
            <div className="relative mr-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUser className="text-blue-500" />
              </div>
              {user.role === "creator" && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">⭐</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.nickname}
                {user.nickname === currentUser && " (You)"}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>

            {isCreator && user.role !== "creator" && (
              <button onClick={() => changeUserRole(user.id, user.role === "viewer" ? "editor" : "viewer")} className={`p-1 rounded-full ${user.role === "viewer" ? "text-blue-500 hover:bg-blue-50" : "text-purple-500 hover:bg-purple-50"}`} title={user.role === "viewer" ? "Make editor" : "Make viewer"}>
                {user.role === "viewer" ? <FiEdit2 /> : <FiEye />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
