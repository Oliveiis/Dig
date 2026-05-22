import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  name: string;
  id: string;
  avatar: string;
}

interface UserStore {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: {
        name: 'Jiayi',
        id: 'jiayi · dig#0421',
        avatar: 'J',
      },
      updateProfile: (newProfile) => set((state) => ({
        profile: { ...state.profile, ...newProfile }
      })),
    }),
    {
      name: 'dig-user',
    }
  )
);
