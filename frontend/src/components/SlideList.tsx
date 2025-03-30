"use client";

import { useEffect, useState } from "react";
import { SlideAPI } from "@/lib/api/slides";
import { useUserStore } from "@/lib/store";
import { FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";

interface SlideListProps {
  presentationId: number;
  onSlideSelect: (slideId: number) => void;
}

export default function SlideList({ presentationId, onSlideSelect }: SlideListProps) {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, role } = useUserStore();

  useEffect(() => {
    const loadSlides = async () => {
      try {
        setLoading(true);
        const data = await SlideAPI.getSlides(presentationId);
        setSlides(data);
      } catch (err) {
        setError("Failed to load slides");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSlides();
  }, [presentationId]);

  const handleAddSlide = async () => {
    if (role !== "creator") return;

    try {
      const newSlide = await SlideAPI.createSlide(presentationId, slides.length, userId);
      setSlides([...slides, newSlide]);
    } catch (err) {
      setError("Failed to add slide");
      console.error(err);
    }
  };

  const handleDeleteSlide = async (slideId: number) => {
    if (role !== "creator") return;

    try {
      await SlideAPI.deleteSlide(slideId, presentationId, userId);
      setSlides(slides.filter((slide) => slide.id !== slideId));
    } catch (err) {
      setError("Failed to delete slide");
      console.error(err);
    }
  };

  if (loading) return <div>Loading slides...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-medium">Slides</h3>
        {role === "creator" && (
          <button onClick={handleAddSlide} className="p-1 rounded-full hover:bg-gray-100" title="Add Slide">
            <FiPlus />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`relative p-2 border rounded cursor-pointer hover:bg-gray-50 ${index === 0 ? "bg-blue-50" : ""}`} onClick={() => onSlideSelect(slide.id)}>
            <div className="aspect-video bg-white flex items-center justify-center">Slide {index + 1}</div>

            {(role === "creator" || role === "editor") && (
              <div className="absolute top-1 right-1 flex space-x-1">
                <button
                  className="p-1 text-gray-500 hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implement edit functionality
                  }}
                >
                  <FiEdit2 size={14} />
                </button>

                {role === "creator" && (
                  <button
                    className="p-1 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSlide(slide.id);
                    }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
