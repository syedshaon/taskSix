
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { useUserStore } from "@/lib/store";
import dynamic from "next/dynamic";
import { SlideAPI } from "@/lib/api/slides";

// Dynamically import components for better performance
const SlideCanvas = dynamic(() => import("@/components/SlideCanvas"), { ssr: false });
const ToolPanel = dynamic(() => import("@/components/ToolPanel"), { ssr: false });
const UsersPanel = dynamic(() => import("@/components/UsersPanel"), { ssr: false });
const SlideThumbnail = dynamic(() => import("@/components/SlideThumbnail"), { ssr: false });

type Slide = {
  id: number;
  presentation_id: number;
  position: number;
  background_color: string;
  transition_type: string;
};

type SlideElement = {
  id: string;
  type: "text" | "shape" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  style?: Record<string, string>;
};

export default function PresentationPage() {
  const { id } = useParams();
  const { userId, nickname, role } = useUserStore();
  const { sendMessage, lastMessage } = useWebSocket();
  const presentationId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id || "0");

  const [elements, setElements] = useState<SlideElement[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load slides and initial elements
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const loadedSlides = await SlideAPI.getSlides(presentationId);
        setSlides(loadedSlides);
        
        if (loadedSlides.length > 0) {
          const currentSlideId = loadedSlides[currentSlideIndex].id;
          const elementsRes = await fetch(`/api/slide-elements/${currentSlideId}`);
          const elementsData = await elementsRes.json();
          setElements(elementsData);
        }
      } catch (err) {
        setError("Failed to load presentation data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (presentationId) loadInitialData();
  }, [presentationId]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const message = JSON.parse(lastMessage.data);

    switch (message.type) {
      case "element_added":
        if (message.slideId === slides[currentSlideIndex]?.id) {
          setElements((prev) => [...prev, message.element]);
        }
        break;
        
      case "element_updated":
        if (message.slideId === slides[currentSlideIndex]?.id) {
          setElements((prev) => 
            prev.map((el) => (el.id === message.element.id ? message.element : el))
          );
        }
        break;
        
      case "slide_added":
        setSlides((prev) => [...prev, message.slide]);
        break;
        
      case "slide_changed":
        setCurrentSlideIndex(message.index);
        break;
        
      case "slide_updated":
        setSlides((prev) => 
          prev.map((slide) => 
            slide.id === message.slide.id ? message.slide : slide
          )
        );
        break;
    }
  }, [lastMessage, currentSlideIndex, slides]);

  const handleAddElement = (element: Omit<SlideElement, "id">) => {
    if (!userId || (role !== "creator" && role !== "editor")) return;

    const newElement = {
      ...element,
      id: `el-${Date.now()}`,
    };

    sendMessage({
      type: "add_element",
      presentationId,
      slideId: slides[currentSlideIndex].id,
      element: newElement,
      userId
    });
  };

  const handleUpdateElement = (id: string, updates: Partial<SlideElement>) => {
    if (!userId || (role !== "creator" && role !== "editor")) return;

    sendMessage({
      type: "update_element",
      presentationId,
      slideId: slides[currentSlideIndex].id,
      elementId: id,
      updates,
      userId
    });
  };

  const addNewSlide = async () => {
    if (role !== "creator") return;

    try {
      const newSlide = await SlideAPI.createSlide(
        presentationId,
        slides.length,
        userId
      );
      
      sendMessage({
        type: "slide_added",
        presentationId,
        slide: newSlide,
        userId
      });
    } catch (err) {
      setError("Failed to add new slide");
      console.error(err);
    }
  };

  const changeSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    
    setCurrentSlideIndex(index);
    sendMessage({
      type: "slide_changed",
      presentationId,
      index,
      userId
    });
  };

  const updateCurrentSlide = (updates: Partial<Slide>) => {
    if (role !== "creator" && role !== "editor") return;

    const currentSlide = slides[currentSlideIndex];
    SlideAPI.updateSlide(
      currentSlide.id,
      presentationId,
      updates,
      userId
    ).then(updatedSlide => {
      sendMessage({
        type: "slide_updated",
        presentationId,
        slide: updatedSlide,
        userId
      });
    });