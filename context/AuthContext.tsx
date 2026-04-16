import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@testforge_token';
const USER_KEY  = '@testforge_user';

type User = { id: number; username: string; name: string; role: string };

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  token: null, user: null, isLoading: true,
  signIn: async () => {}, signOut: async () => {},
});

/** Provides JWT token and user identity to the whole app, persisted across restarts. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]     = useState<string | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Load persisted token + user on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]).then(([savedToken, savedUser]) => {
      if (savedToken) setToken(savedToken);
      if (savedUser)  setUser(JSON.parse(savedUser));
    }).finally(() => setLoading(false));
  }, []);

  /** Persists the token and user after a successful login. */
  async function signIn(newToken: string, newUser: User) {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, newToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  }

  /** Clears the token and user, returning to the login screen. */
  async function signOut() {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Returns the current auth token, user, and sign-in/sign-out functions. */
export function useAuth() {
  return useContext(AuthContext);
}
