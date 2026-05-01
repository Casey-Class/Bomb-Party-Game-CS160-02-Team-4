import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import { generateGuestName } from "@/lib/player-identity";

export interface User {
  avatarColor: string;
  avatarUrl: string | null;
  id: number;
  username: string;
}

interface ProfileDataResponse {
  recentGames?: unknown[];
  stats?: unknown;
  success?: boolean;
  user?: User;
}

interface AuthContextType {
  getProfileData: (username: string) => Promise<ProfileDataResponse>;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginAsGuest: (username?: string) => void;
  logout: () => void;
  register: (username: string, password: string) => Promise<boolean>;
  token: string | null;
  updateAvatarColor: (avatarColor: string) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "/api/auth";
const DEFAULT_AVATAR_COLOR = "#a855f7";

function parseStoredUser(rawUser: string) {
  const parsedUser = JSON.parse(rawUser) as Partial<User>;

  return {
    id: parsedUser.id ?? 0,
    username: parsedUser.username ?? generateGuestName(),
    avatarColor: parsedUser.avatarColor ?? DEFAULT_AVATAR_COLOR,
    avatarUrl: parsedUser.avatarUrl ?? null,
  } satisfies User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guest");
    toast.success("Logged out successfully!");
    navigate("/login");
  }, [navigate]);

  const validateToken = useCallback(
    async (tokenToValidate: string) => {
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
          return;
        }

        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (error) {
        console.error("Token validation error:", error);
      }
    },
    [logout]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedGuest = localStorage.getItem("guest");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(parseStoredUser(storedUser));
        setIsGuest(false);
        localStorage.removeItem("guest");
        validateToken(storedToken);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    if (storedGuest === "true" && storedUser) {
      try {
        setUser(parseStoredUser(storedUser));
        setIsGuest(true);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Error parsing guest user:", error);
        localStorage.removeItem("guest");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, [validateToken]);

  function persistUser(nextUser: User) {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
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
        persistUser(data.user);
        setToken(data.token);
        setIsGuest(false);
        localStorage.setItem("token", data.token);
        localStorage.removeItem("guest");
        toast.success("Login successful!");
        return true;
      }
      toast.error(data.message || "Login failed");
      return false;
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    username: string,
    password: string
  ): Promise<boolean> => {
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
        persistUser(data.user);
        setToken(data.token);
        setIsGuest(false);
        localStorage.setItem("token", data.token);
        localStorage.removeItem("guest");
        toast.success("Registration successful!");
        return true;
      }
      toast.error(data.message || "Registration failed");
      return false;
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Registration error:", error);
      return false;
    }
  };

  const loginAsGuest = (username?: string) => {
    const normalizedUsername = username?.trim();
    const guestUser = {
      id: 0,
      username: normalizedUsername || generateGuestName(),
      avatarColor: DEFAULT_AVATAR_COLOR,
      avatarUrl: null,
    };
    setUser(guestUser);
    setToken(null);
    setIsGuest(true);
    localStorage.setItem("guest", "true");
    localStorage.setItem("user", JSON.stringify(guestUser));
    localStorage.removeItem("token");
    toast.success("Playing as guest!");
  };

  const getProfileData = async (
    username: string
  ): Promise<ProfileDataResponse> => {
    const response = await fetch(`/api/auth/profile?username=${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.json();
  };

  const updateAvatarColor = async (avatarColor: string): Promise<boolean> => {
    if (isGuest) {
      if (!user) {
        return false;
      }

      const updatedGuestUser = { ...user, avatarColor };
      persistUser(updatedGuestUser);
      return true;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarColor }),
      });

      const data = await response.json();

      if (!(data.success && data.user)) {
        toast.error(data.message || "Failed to update avatar color");
        return false;
      }

      persistUser(data.user);
      return true;
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Update avatar color error:", error);
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    if (!user || isGuest) {
      toast.error("Guests can't upload avatars");
      return false;
    }

    try {
      const formData = new FormData();
      formData.set("avatar", file);

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!(data.success && data.user)) {
        toast.error(data.message || "Failed to upload avatar");
        return false;
      }

      persistUser(data.user);
      return true;
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Upload avatar error:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user) && !isGuest,
    isGuest,
    login,
    register,
    logout,
    loginAsGuest,
    getProfileData,
    updateAvatarColor,
    uploadAvatar,
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
