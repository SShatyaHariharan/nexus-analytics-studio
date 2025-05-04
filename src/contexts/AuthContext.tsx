
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import api from "@/services/api";

// Define types for our context
interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  checkAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Check authentication status
  const checkAuth = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }
    setIsLoading(false);
  };
  
  // Login function
  const login = async (data: LoginData) => {
    const response = await api.post("/auth/login", data);
    const { access_token, refresh_token, user } = response.data;
    
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(user);
  };
  
  // Register function
  const register = async (data: RegisterData) => {
    await api.post("/auth/register", data);
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };
  
  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const response = await api.put(`/users/${user.id}`, data);
    setUser(response.data);
  };
  
  // Check if user has a specific permission
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Basic permission check based on role
    switch (user.role) {
      case "admin":
        return true;
      case "developer":
        return permission !== "admin_only";
      case "analyst":
        return ["view_data", "create_chart", "edit_chart"].includes(permission);
      case "viewer":
        return permission === "view_data";
      default:
        return false;
    }
  };
  
  const authContextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    hasPermission,
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
