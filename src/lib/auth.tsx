import { createContext, useContext, useState, type ReactNode } from 'react';

export interface EmployeeProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  department: string;
  is_admin: boolean;
}

interface AuthContextType {
  profile: EmployeeProfile | null;
  isAdmin: boolean;
  signIn: (username: string, password: string) => { error: string | null };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS: Record<string, EmployeeProfile> = {
  'samarth.rai': {
    id: '2043e823-0723-4be8-9128-b9a07d62ddc7',
    username: 'samarth.rai',
    name: 'Samarth Rai',
    email: 'samarthraib6@gmail.com',
    role: 'Founder & CEO',
    avatar: 'SR',
    department: 'Operations & Logistics',
    is_admin: true,
  },
  'karthik.shetty': {
    id: '86922bb1-0061-49c4-87dc-791481c79c49',
    username: 'karthik.shetty',
    name: 'Karthik Shetty',
    email: 'shettyshines@gmail.com',
    role: 'Co-Founder',
    avatar: 'KS',
    department: 'Packaging & Product',
    is_admin: false,
  },
  'dhanraj.shetty': {
    id: 'aaac4e96-897a-48b8-be3f-64f4083e6c04',
    username: 'dhanraj.shetty',
    name: 'Dhanraj Shetty',
    email: 'dhanrajshetty@tirtam.com',
    role: 'Operations Lead',
    avatar: 'DS',
    department: 'Operations & Logistics',
    is_admin: false,
  },
};

const PASSWORD = 'Tirtam@123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(() => {
    const saved = localStorage.getItem('tirtam-auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (USERS[parsed.username]) return USERS[parsed.username];
      } catch { /* ignore */ }
    }
    return null;
  });

  function signIn(username: string, password: string) {
    const user = USERS[username.toLowerCase().trim()];
    if (!user) return { error: 'User not found. Try: samarth.rai, karthik.shetty, or dhanraj.shetty' };
    if (password !== PASSWORD) return { error: 'Incorrect password' };
    setProfile(user);
    localStorage.setItem('tirtam-auth', JSON.stringify(user));
    return { error: null };
  }

  function signOut() {
    setProfile(null);
    localStorage.removeItem('tirtam-auth');
    localStorage.removeItem('tirtam-os');
  }

  return (
    <AuthContext.Provider value={{ profile, isAdmin: profile?.is_admin || false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
