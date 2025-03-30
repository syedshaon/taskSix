"use client";

type ToolbarProps = {
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  userRole: "viewer" | "editor" | "creator" | "admin";
};

export default function Toolbar({ activeTool, setActiveTool, userRole }: ToolbarProps) {
  if (userRole === "viewer") return null;

  const tools = [
    { id: "text", label: "Text", icon: "T" },
    { id: "rectangle", label: "Rectangle", icon: "□" },
    { id: "circle", label: "Circle", icon: "○" },
    { id: "arrow", label: "Arrow", icon: "→" },
    { id: "image", label: "Image", icon: "🖼️" },
  ];

  return (
    <div className="bg-gray-800 text-white p-2 flex gap-2">
      {tools.map((tool) => (
        <button key={tool.id} onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)} className={`p-2 rounded ${activeTool === tool.id ? "bg-blue-500" : "bg-gray-600 hover:bg-gray-500"}`} title={tool.label}>
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
