"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Rnd } from "react-rnd";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { FiUpload, FiX, FiImage } from "react-icons/fi";

type ImageElementProps = {
  element: {
    id: string;
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    url?: string;
    alt?: string;
    style?: React.CSSProperties;
  };
  onUpdate: (id: string, updates: Partial<ImageElementProps["element"]>) => void;
  editable: boolean;
};

export default function ImageElement({ element, onUpdate, editable }: ImageElementProps) {
  const { sendMessage } = useWebSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState(element.url || "");
  const [showPlaceholder, setShowPlaceholder] = useState(!element.url);

  // Handle initial load and URL changes
  useEffect(() => {
    if (element.url) {
      setLocalUrl(element.url);
      setShowPlaceholder(false);
    } else {
      setShowPlaceholder(true);
    }
  }, [element.url]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Create a temporary local URL for preview
      const tempUrl = URL.createObjectURL(file);
      setLocalUrl(tempUrl);
      setShowPlaceholder(false);

      // In a real app, you would upload to your server here
      const formData = new FormData();
      formData.append("image", file);
      formData.append("elementId", element.id);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const { url } = await response.json();

      // Update the element with the permanent URL
      onUpdate(element.id, { url, alt: file.name });

      // Broadcast the update to other collaborators
      sendMessage({
        type: "update_element",
        elementId: element.id,
        updates: { url, alt: file.name },
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      setLocalUrl("");
      setShowPlaceholder(true);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setLocalUrl("");
    setShowPlaceholder(true);
    onUpdate(element.id, { url: undefined, alt: undefined });

    sendMessage({
      type: "update_element",
      elementId: element.id,
      updates: { url: undefined, alt: undefined },
    });
  };

  const handleDragStop = (_: any, data: { x: number; y: number }) => {
    onUpdate(element.id, { x: data.x, y: data.y });
  };

  const handleResizeStop = (_: any, __: any, ref: HTMLElement, ___: any, position: { x: number; y: number }) => {
    onUpdate(element.id, {
      width: ref.offsetWidth,
      height: ref.offsetHeight,
      ...position,
    });
  };

  return (
    <Rnd position={{ x: element.x, y: element.y }} size={{ width: element.width, height: element.height }} onDragStop={handleDragStop} onResizeStop={handleResizeStop} disableDragging={!editable} enableResizing={editable} minWidth={100} minHeight={100} className="z-20" style={element.style}>
      <div className="w-full h-full relative">
        {showPlaceholder && editable ? (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4">
            <FiImage className="text-3xl text-gray-400 mb-2" />
            <p className="text-gray-500 text-center mb-3">Click to upload image</p>
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-3 py-1 bg-blue-500 text-white rounded flex items-center text-sm">
              <FiUpload className="mr-2" />
              {isUploading ? "Uploading..." : "Select Image"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        ) : localUrl ? (
          <>
            <img src={localUrl} alt={element.alt || "Presentation image"} className="w-full h-full object-contain pointer-events-none" />
            {editable && (
              <button onClick={handleRemoveImage} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2 shadow-lg hover:bg-red-600" title="Remove image">
                <FiX size={16} />
              </button>
            )}
          </>
        ) : null}
      </div>
    </Rnd>
  );
}
