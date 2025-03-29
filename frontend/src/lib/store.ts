import { create } from "zustand";

interface UserState {
  nickname: string;
  setNickname: (nickname: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  nickname: "",
  setNickname: (nickname) => set({ nickname }),
}));
