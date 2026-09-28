import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';

export interface DeviceAccount {
  id: string;
  type: 'google' | 'github' | 'campus';
  identifier: string; // email or username
  displayName: string;
  avatarUrl?: string | null;
  lastUsed: number;
}


interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  deviceAccounts: DeviceAccount[];
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  saveDeviceAccount: (account: Omit<DeviceAccount, 'lastUsed'>) => void;
  removeDeviceAccount: (id: string) => void;
}

const DEFAULT_DEVICE_ACCOUNTS: DeviceAccount[] = [
  {
    id: 'g-nandha',
    type: 'google',
    identifier: 'nandhakkishore@gmail.com',
    displayName: 'Nandha Kishore',
    lastUsed: Date.now(),
  },
  {
    id: 'gh-nandha',
    type: 'github',
    identifier: 'Nandhakkishore',
    displayName: 'Nandhakkishore',
    lastUsed: Date.now() - 10000,
  },
];

const fallbackStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      deviceAccounts: DEFAULT_DEVICE_ACCOUNTS,

      setAuth: (user, accessToken, refreshToken) => {
        // Automatically save account to device accounts list
        const identifier = user.email.includes('@github.user')
          ? user.email.replace('@github.user', '')
          : user.email;
        const type = user.email.includes('@github.user') ? 'github' : 'google';

        get().saveDeviceAccount({
          id: user.id || identifier,
          type,
          identifier,
          displayName: user.profile?.fullName || identifier,
          avatarUrl: user.profile?.avatarUrl,
        });

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      saveDeviceAccount: (account) => {
        const existing = get().deviceAccounts || [];
        const filtered = existing.filter(
          (a) => a.identifier.toLowerCase() !== account.identifier.toLowerCase()
        );
        const updated: DeviceAccount = {
          ...account,
          lastUsed: Date.now(),
        };
        set({
          deviceAccounts: [updated, ...filtered],
        });
      },

      removeDeviceAccount: (id) => {
        const existing = get().deviceAccounts || [];
        set({
          deviceAccounts: existing.filter((a) => a.id !== id),
        });
      },
    }),
    {
      name: 'campusconnect-auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' && window.localStorage ? window.localStorage : fallbackStorage
      ),
    }
  )
);
