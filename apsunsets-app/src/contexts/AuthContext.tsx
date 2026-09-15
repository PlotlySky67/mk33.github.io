import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from '@firebase/auth';

import { auth } from '../firebase/config';
import { createUserProfile, subscribeToFollowing } from '../firebase/users';

interface FollowedUser {
  uid: string;
  displayName: string;
}

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  following: FollowedUser[];
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [following, setFollowing] = useState<FollowedUser[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setFollowing([]);
      return;
    }
    return subscribeToFollowing(user.uid, setFollowing);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      following,
      async signUp(displayName, email, password) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        await createUserProfile(credential.user.uid, displayName, email);
      },
      async logIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async logOut() {
        await signOut(auth);
      },
    }),
    [user, initializing, following]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
