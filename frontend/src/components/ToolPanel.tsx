"use client";

const tools = [
  { id: "select", name: "Select", icon: "🖱️" },
  { id: "text", name: "Text", icon: "T" },
  { id: "rectangle", name: "Rectangle", icon: "□" },
  { id: "circle", name: "Circle", icon: "○" },
  { id: "line", name: "Line", icon: "─" },
  { id: "image", name: "Image", icon: "🖼️" },
];

type ToolPanelProps = {
  activeTool: string | null;
  onToolSelect: React.Dispatch<React.SetStateAction<string | null>>;
  onPresent: () => void;
};

export default function ToolPanel({ activeTool, onToolSelect, onPresent }: ToolPanelProps) {
  return (
    <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
      <div className="flex space-x-1">
        {tools.map((tool) => (
          <button key={tool.id} className={`p-2 rounded ${activeTool === tool.id ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"}`} onClick={() => onToolSelect(tool.id === activeTool ? null : tool.id)} title={tool.name}>
            {tool.icon}
          </button>
        ))}
      </div>
      <button onClick={onPresent} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded">
        Present
      </button>
    </div>
  );
}
