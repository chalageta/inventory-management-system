'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

// ✅ Matches your DB response structure
interface User {
  id: number;
  name: string;
  role_name: string;
  email: string;
  phone:string,
  gender:string,
  address:string,  
  bio: string | null;
  image: string | null;
}

interface AuthContextType {
  user: User | null;
  permissions: string[]; 
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  can: (permission: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]); // ✅ State for permissions
  const [loading, setLoading] = useState(true);

  // ✅ Get current user and their permissions
  const getMe = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me', { withCredentials: true });
      
      // res.data structure: { user: {...}, permissions: [...] }
      setUser(res.data.user);
      setPermissions(res.data.permissions || []);
    } catch (err) {
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await api.post('/auth/login', { email, password });
      await getMe(); // fetch user + perms after login
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/auth/logout');
      setUser(null);
      setPermissions([]); // Clear permissions on logout
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Helper function to check permissions anywhere in the app
   * Usage: can('view_finance') or can(['add_inventory', 'update_inventory'])
   */
  const can = (permission: string | string[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    
    if (Array.isArray(permission)) {
      // Returns true if user has ANY of the required permissions
      return permission.some(p => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  // ✅ Auto fetch user on mount
  useEffect(() => {
    // Check if we have an active session
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      getMe();
    } else {
      setLoading(false); 
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions, // ✅ Exported permissions
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        getMe,
        can, // ✅ Exported helper
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};