import { create } from 'zustand';
import type { User } from '../domain/User';

interface UserSession {
  user: User | null;
  setUser: (user: User) => void;
  signOut: () => void;
}

export const useUserSession = create<UserSession>((set) => ({
  user: null,
  setUser: (user) => set({ user: { id: user.id, fullName: user.fullName, email: user.email } }),
  signOut: () => set({ user: null }),
}));
