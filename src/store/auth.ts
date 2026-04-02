import { create } from "zustand";

type User = {
  uid: string;
  email: string | null;
  fullname?: string;
} | null;

type AuthState = {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
