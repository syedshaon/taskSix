import axios from "axios";

const API_BASE = process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api";

interface Slide {
  id: number;
  presentation_id: number;
  position: number;
  background_color: string;
  transition_type: string;
}

export const SlideAPI = {
  // Get all slides for a presentation
  async getSlides(presentationId: number): Promise<Slide[]> {
    const response = await axios.get(`${API_BASE}/slides/${presentationId}`);
    return response.data;
  },

  // Create a new slide (creator only)
  async createSlide(presentationId: number, position: number, userId: string, backgroundColor = "#FFFFFF", transitionType = "none"): Promise<Slide> {
    const response = await axios.post(
      `${API_BASE}/slides`,
      {
        presentation_id: presentationId,
        position,
        background_color: backgroundColor,
        transition_type: transitionType,
      },
      {
        params: { userId },
      }
    );
    return response.data;
  },

  // Update a slide (editor or creator)
  async updateSlide(slideId: number, presentationId: number, updates: Partial<Slide>, userId: string): Promise<Slide> {
    const response = await axios.put(`${API_BASE}/slides/${slideId}/${presentationId}`, updates, { params: { userId } });
    return response.data;
  },

  // Delete a slide (creator only)
  async deleteSlide(slideId: number, presentationId: number, userId: string): Promise<void> {
    await axios.delete(`${API_BASE}/slides/${slideId}/${presentationId}`, {
      params: { userId },
    });
  },
};
