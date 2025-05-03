
import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { toast } from "sonner";
import api from "@/services/api";

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: {
    id: number;
    name: string;
    permissions: number;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAdmin: () => boolean;
  hasPermission: (permission: number) => boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      const response = await api.get("/auth/me");
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Authentication check failed:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { access_token, refresh_token, user } = response.data;
      
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      
      setUser(user);
      setIsAuthenticated(true);
      toast.success("Login successful");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      await api.post("/auth/register", userData);
      toast.success("Registration successful! Please login.");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsAuthenticated(false);
    toast.info("You have been logged out");
  };

  const isAdmin = () => {
    return user?.role?.name === "Admin";
  };

  const hasPermission = (permission: number) => {
    return user?.role?.permissions ? (user.role.permissions & permission) === permission : false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      checkAuth,
      isAdmin,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
