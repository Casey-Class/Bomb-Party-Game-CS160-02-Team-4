import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";

export interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:5555/api/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedGuest = localStorage.getItem("guest");

    if (storedGuest === "true" && storedUser) {
      try {
        const guestUser = JSON.parse(storedUser);
        setUser(guestUser);
        setIsGuest(true);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Error parsing guest user:", error);
        localStorage.removeItem("guest");
        localStorage.removeItem("user");
      }
    }

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        
        validateToken(storedToken);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    
    setIsLoading(false);
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        logout();
        toast.error("Session expired. Please log in again.");
      }
    } catch (error) {
      console.error("Token validation error:", error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setIsGuest(false);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("guest");
        toast.success("Login successful!");
        return true;
      } else {
        toast.error(data.message || "Login failed");
        return false;
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setIsGuest(false);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("guest");
        toast.success("Registration successful!");
        return true;
      } else {
        toast.error(data.message || "Registration failed");
        return false;
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Registration error:", error);
      return false;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      id: 0,
      username: `Guest_${Math.random().toString(36).substr(2, 9)}`,
    };
    setUser(guestUser);
    setToken(null);
    setIsGuest(true);
    localStorage.setItem("guest", "true");
    localStorage.setItem("user", JSON.stringify(guestUser));
    localStorage.removeItem("token");
    toast.success("Playing as guest!");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guest");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !isGuest,
    isGuest,
    login,
    register,
    logout,
    loginAsGuest,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
