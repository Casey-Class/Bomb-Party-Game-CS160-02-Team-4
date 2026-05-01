import {
  createUser,
  getUserById,
  getUserByUsername,
  verifyPassword,
} from "../lib/auth";
import {
  extractTokenFromHeader,
  generateToken,
  verifyToken,
} from "../lib/jwt";
import { buildAbsoluteUrl } from "../lib/http";

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    avatarColor: string;
    avatarUrl: string | null;
  };
  token?: string;
}

function serializeAuthUser(
  req: Request,
  user: {
    id: number;
    username: string;
    avatar_color: string;
    avatar_url: string | null;
  },
) {
  return {
    id: user.id,
    username: user.username,
    avatarColor: user.avatar_color,
    avatarUrl: buildAbsoluteUrl(req, user.avatar_url),
  };
}

export async function registerHandler(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => null)) as RegisterRequest | null;

    if (!body || !body.username || !body.password) {
      return Response.json({
        success: false,
        message: "Username and password are required",
      } as AuthResponse, { status: 400 });
    }

    if (body.username.length < 3) {
      return Response.json({
        success: false,
        message: "Username must be at least 3 characters long",
      } as AuthResponse, { status: 400 });
    }

    if (body.password.length < 6) {
      return Response.json({
        success: false,
        message: "Password must be at least 6 characters long",
      } as AuthResponse, { status: 400 });
    }

    const existingUser = await getUserByUsername(body.username);
    if (existingUser) {
      return Response.json({
        success: false,
        message: "Username already exists",
      } as AuthResponse, { status: 409 });
    }

    const user = await createUser(body.username, body.password);
    if (!user) {
      return Response.json({
        success: false,
        message: "Failed to create user",
      } as AuthResponse, { status: 500 });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    return Response.json({
      success: true,
      message: "User registered successfully",
      user: serializeAuthUser(req, user),
      token,
    } as AuthResponse);
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json({
      success: false,
      message: "Internal server error",
    } as AuthResponse, { status: 500 });
  }
}

export async function loginHandler(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => null)) as LoginRequest | null;

    if (!body || !body.username || !body.password) {
      return Response.json({
        success: false,
        message: "Username and password are required",
      } as AuthResponse, { status: 400 });
    }

    const user = await getUserByUsername(body.username);
    if (!user) {
      return Response.json({
        success: false,
        message: "Invalid username or password",
      } as AuthResponse, { status: 401 });
    }

    const isValidPassword = await verifyPassword(
      body.password,
      user.password_hash,
    );
    if (!isValidPassword) {
      return Response.json({
        success: false,
        message: "Invalid username or password",
      } as AuthResponse, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    return Response.json({
      success: true,
      message: "Login successful",
      user: serializeAuthUser(req, user),
      token,
    } as AuthResponse);
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({
      success: false,
      message: "Internal server error",
    } as AuthResponse, { status: 500 });
  }
}

export async function validateHandler(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return Response.json({
        success: false,
        message: "No token provided",
      } as AuthResponse, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({
        success: false,
        message: "Invalid or expired token",
      } as AuthResponse, { status: 401 });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
      } as AuthResponse, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Token is valid",
      user: serializeAuthUser(req, user),
    } as AuthResponse);
  } catch (error) {
    console.error("Token validation error:", error);
    return Response.json({
      success: false,
      message: "Internal server error",
    } as AuthResponse, { status: 500 });
  }
}

export const registerEndpoint = registerHandler;
export const loginEndpoint = loginHandler;
export const validateEndpoint = validateHandler;
