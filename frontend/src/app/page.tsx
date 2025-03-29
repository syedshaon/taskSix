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

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/presentations")
      .then((res) => setPresentations(res.data))
      .catch((err) => console.error("Error fetching presentations:", err));
  }, []);

  const createPresentation = async () => {
    if (!newTitle) return;
    try {
      const res = await axios.post("http://localhost:5000/api/presentations", { title: newTitle });
      setPresentations([...presentations, res.data]);
      setNewTitle("");
    } catch (err) {
      console.error("Error creating presentation:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold">Collaborative Presentation</h1>

      <div className="mt-4">
        <input type="text" placeholder="Enter your nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="border p-2 rounded" />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Presentations</h2>
        <ul className="mt-2">
          {presentations.map((p) => (
            <li key={p.id} className="mt-2">
              <Link href={`/presentation/${p.id}`}>
                <span className="text-blue-500 cursor-pointer">{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <input type="text" placeholder="New presentation title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border p-2 rounded" />
        <button onClick={createPresentation} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
          Create
        </button>
      </div>
    </div>
  );
}
