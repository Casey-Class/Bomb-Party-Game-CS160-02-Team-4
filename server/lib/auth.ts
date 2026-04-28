import bcrypt from 'bcryptjs';
import { db } from '../db/init';

const SALT_ROUNDS = 12;

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(username: string, password: string): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
      RETURNING id, username, password_hash, created_at
    `);
    
    const user = stmt.get(username, passwordHash) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const stmt = db.prepare(`
      SELECT id, username, password_hash, created_at
      FROM users
      WHERE username = ?
    `);
    
    const user = stmt.get(username) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const stmt = db.prepare(`
      SELECT id, username, password_hash, created_at
      FROM users
      WHERE id = ?
    `);
    
    const user = stmt.get(id) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}
