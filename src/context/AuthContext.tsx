import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/config/firebase';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') {
         // Gracefully ignore this error
         console.warn('Login popup closed by user');
         return;
      }
      console.error(e);
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (displayName: string, photoURL: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL });
      // Update local state by forcing a re-evaluation or just cloning user
      setUser({ ...auth.currentUser } as User);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

