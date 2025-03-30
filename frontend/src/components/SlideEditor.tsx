"use client";

import { useState, useEffect } from "react";
import { SlideAPI } from "@/lib/api/slides";
import { useUserStore } from "@/lib/store";

interface SlideEditorProps {
  slideId: number;
  presentationId: number;
}

export default function SlideEditor({ slideId, presentationId }: SlideEditorProps) {
  const [slide, setSlide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, role } = useUserStore();

  useEffect(() => {
    const loadSlide = async () => {
      try {
        setLoading(true);
        const slides = await SlideAPI.getSlides(presentationId);
        const currentSlide = slides.find((s) => s.id === slideId);
        if (!currentSlide) throw new Error("Slide not found");
        setSlide(currentSlide);
      } catch (err) {
        setError("Failed to load slide");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSlide();
  }, [slideId, presentationId]);

  const handleUpdateSlide = async (updates: any) => {
    if (role !== "creator" && role !== "editor") return;

    try {
      const updatedSlide = await SlideAPI.updateSlide(slideId, presentationId, updates, userId);
      setSlide(updatedSlide);
    } catch (err) {
      setError("Failed to update slide");
      console.error(err);
    }
  };

  if (loading) return <div>Loading slide...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!slide) return <div>Slide not found</div>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Slide {slide.position + 1}</h2>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0" style={{ backgroundColor: slide.background_color }}>
          {/* Your slide content would go here */}
          <div className="p-4">
            <p>Slide content area</p>

            {(role === "creator" || role === "editor") && (
              <div className="mt-4 p-4 border rounded bg-white">
                <h3 className="font-medium mb-2">Slide Properties</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Background Color</label>
                    <input type="color" value={slide.background_color} onChange={(e) => handleUpdateSlide({ background_color: e.target.value })} className="w-full" />
                  </div>

                  <div>
                    <label className="block text-sm">Transition</label>
                    <select value={slide.transition_type} onChange={(e) => handleUpdateSlide({ transition_type: e.target.value })} className="w-full p-2 border rounded">
                      <option value="none">None</option>
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
