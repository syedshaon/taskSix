import { useEffect, useState } from "react";
import { useWebSocket } from "@/app/context/WebSocketContext";

type User = {
  id: string;
  nickname: string;
  role: "viewer" | "editor" | "creator";
};

type RoleManagementProps = {
  presentationId: string;
  currentUser: User;
};

export default function RoleManagement({ presentationId, currentUser }: RoleManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const { sendMessage, lastMessage } = useWebSocket(); // ✅ Remove argument

  useEffect(() => {
    console.log("Last WebSocket message:", lastMessage); // Debugging

    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      console.log("Received message:", message); // See what data arrives

      if (message.type === "update_users") {
        setUsers(message.users);
      }
    }
  }, [lastMessage]);

  const handleRoleChange = (userId: string, newRole: "viewer" | "editor") => {
    if (currentUser.role !== "creator") return;
    sendMessage({ type: "change_role", userId, newRole });
  };

  return (
    <div className="p-4 bg-gray-100 rounded-md w-64">
      <h2 className="text-lg font-semibold">Connected Users</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index} className="flex justify-between items-center p-2 border-b">
            <span>
              {user.nickname} ({user.role})
            </span>
            {currentUser.role === "creator" && user.role !== "creator" && (
              <button onClick={() => handleRoleChange(user.id, user.role === "viewer" ? "editor" : "viewer")} className="text-blue-500 hover:underline">
                {user.role === "viewer" ? "Make Editor" : "Make Viewer"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
