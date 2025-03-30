"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useUserStore } from "@/lib/store";

interface Presentation {
  id: number;
  title: string;
  created_at: string;
}

export default function HomePage() {
  const { nickname, setNickname } = useUserStore();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");

  useEffect(() => {
    if (nickname) {
      axios
        .get("http://localhost:5000/api/presentations")
        .then((res) => setPresentations(res.data))
        .catch((err) => console.error("Error fetching presentations:", err));
    }
  }, [nickname]);

  const handleSetNickname = () => {
    if (nicknameInput.trim()) {
      setNickname(nicknameInput);
    }
  };

  const createPresentation = async () => {
    if (!newTitle || !nickname) return;
    try {
      const res = await axios.post("http://localhost:5000/api/presentations", {
        title: newTitle,
        creator: nickname,
      });
      setPresentations([...presentations, res.data]);
      setNewTitle("");
    } catch (err) {
      console.error("Error creating presentation:", err);
    }
  };

  if (!nickname) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-6">Collaborative Presentation</h1>
        <div className="flex flex-col items-center gap-4">
          <input type="text" placeholder="Enter your nickname" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} className="border p-2 rounded w-64" onKeyDown={(e) => e.key === "Enter" && handleSetNickname()} />
          <button onClick={handleSetNickname} className="bg-blue-500 text-white px-4 py-2 rounded w-64">
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="flex justify-between w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-bold">Collaborative Presentation</h1>
        <div className="flex items-center gap-2">
          <span className="font-medium">Hello, {nickname}</span>
          <button
            onClick={() => {
              setNickname("");
              setNicknameInput("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            (Change)
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Create New Presentation</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Presentation title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border p-2 rounded flex-grow" onKeyDown={(e) => e.key === "Enter" && createPresentation()} />
            <button onClick={createPresentation} disabled={!newTitle} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300">
              Create
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Your Presentations</h2>
          {presentations.length === 0 ? (
            <p className="text-gray-500">No presentations yet</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentations.map((p) => (
                <li key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <Link href={`/presentation/${p.id}`} className="block">
                    <h3 className="text-lg font-medium text-blue-600">{p.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Created: {new Date(p.created_at).toLocaleDateString()}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
