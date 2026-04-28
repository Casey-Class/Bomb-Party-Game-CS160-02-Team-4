import { createUser, getUserByUsername, verifyPassword } from '../lib/auth';
import { generateToken, verifyToken, extractTokenFromHeader } from '../lib/jwt';

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
  };
  token?: string;
}

export async function registerHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json() as RegisterRequest;
    
    if (!body.username || !body.password) {
      return Response.json({
        success: false,
        message: 'Username and password are required'
      } as AuthResponse, { status: 400 });
    }

    if (body.username.length < 3) {
      return Response.json({
        success: false,
        message: 'Username must be at least 3 characters long'
      } as AuthResponse, { status: 400 });
    }

    if (body.password.length < 6) {
      return Response.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      } as AuthResponse, { status: 400 });
    }

    const existingUser = await getUserByUsername(body.username);
    if (existingUser) {
      return Response.json({
        success: false,
        message: 'Username already exists'
      } as AuthResponse, { status: 409 });
    }

    const user = await createUser(body.username, body.password);
    if (!user) {
      return Response.json({
        success: false,
        message: 'Failed to create user'
      } as AuthResponse, { status: 500 });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    return Response.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username
      },
      token
    } as AuthResponse);

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse, { status: 500 });
  }
}

export async function loginHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json() as LoginRequest;
    
    if (!body.username || !body.password) {
      return Response.json({
        success: false,
        message: 'Username and password are required'
      } as AuthResponse, { status: 400 });
    }

    const user = await getUserByUsername(body.username);
    if (!user) {
      return Response.json({
        success: false,
        message: 'Invalid username or password'
      } as AuthResponse, { status: 401 });
    }

    const isValidPassword = await verifyPassword(body.password, user.password_hash);
    if (!isValidPassword) {
      return Response.json({
        success: false,
        message: 'Invalid username or password'
      } as AuthResponse, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    return Response.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      },
      token
    } as AuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse, { status: 500 });
  }
}

export async function validateHandler(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return Response.json({
        success: false,
        message: 'No token provided'
      } as AuthResponse, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({
        success: false,
        message: 'Invalid or expired token'
      } as AuthResponse, { status: 401 });
    }

    return Response.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: payload.userId,
        username: payload.username
      }
    } as AuthResponse);

  } catch (error) {
    console.error('Token validation error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse, { status: 500 });
  }
}

export const registerEndpoint = registerHandler;
export const loginEndpoint = loginHandler;
export const validateEndpoint = validateHandler;
