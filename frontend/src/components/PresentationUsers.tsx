"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";

interface User {
  id: string;
  nickname: string;
  role: "viewer" | "editor" | "creator";
}

const PresentationUsers = () => {
  const { id: presentationId } = useParams();
  const [users, setUsers] = useState<User[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("join_presentation", { presentationId });

    newSocket.on("update_users", (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [presentationId]);

  const changeRole = (userId: string, newRole: "viewer" | "editor") => {
    socket.emit("change_role", { presentationId, userId, newRole });
  };

  return (
    <div className="w-1/4 p-4 border-l border-gray-300">
      <h3 className="text-lg font-semibold">Connected Users</h3>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="flex justify-between p-2 border-b">
            <span>
              {user.nickname} ({user.role})
            </span>
            {user.role !== "creator" && (
              <button onClick={() => changeRole(user.id, user.role === "viewer" ? "editor" : "viewer")} className="px-2 py-1 text-sm bg-blue-500 text-white rounded">
                {user.role === "viewer" ? "Make Editor" : "Make Viewer"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PresentationUsers;
