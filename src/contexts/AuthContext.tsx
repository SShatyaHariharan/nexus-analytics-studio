
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import api from "@/services/api";

// Define types for our context
interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: string; // Added role
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string; // Optional role for registration
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission mapping by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "view_dashboard", "edit_dashboard", "delete_dashboard",
    "view_datasource", "edit_datasource", "delete_datasource", 
    "view_dataset", "edit_dataset", "delete_dataset",
    "view_chart", "edit_chart", "delete_chart",
    "manage_users", "view_settings", "edit_settings"
  ],
  manager: [
    "view_dashboard", "edit_dashboard",
    "view_datasource", "edit_datasource",
    "view_dataset", "edit_dataset",
    "view_chart", "edit_chart",
    "view_settings"
  ],
  analyst: [
    "view_dashboard",
    "view_datasource", "edit_datasource",
    "view_dataset", "edit_dataset",
    "view_chart", "edit_chart"
  ],
  user: [
    "view_dashboard",
    "view_datasource",
    "view_dataset",
    "view_chart"
  ]
};

// Context provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication status
  const checkAuth = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await api.get("auth/me");
        setUser(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };
  
  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Login function
  const login = async (data: LoginData) => {
    const response = await api.post("auth/login", data);
    const { access_token, refresh_token, user } = response.data;
    
    localStorage.setItem("token", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    setUser(user);
  };
  
  // Register function
  const register = async (data: RegisterData) => {
    await api.post("auth/register", data);
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };
  
  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const response = await api.put(`users/${user.id}`, data);
    setUser(response.data);
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string) => {
    if (!user) return false;
    const role = user.role || 'user';
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
  };

  // Check if user has a specific role
  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const userRole = user.role || 'user';
    
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    
    return userRole === roles;
  };
  
  const authContextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasPermission,
    hasRole,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
