import { db, isDatabaseReady } from '@/lib/db';
import { adminSessions } from '@/lib/db/schema';
import { eq, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate admin credentials and create session
 */
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  // Check credentials against env variables
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD not configured');
    return { success: false, error: 'Admin access not configured' };
  }
  
  if (username !== adminUsername || password !== adminPassword) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  // Create session
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  if (isDatabaseReady()) {
    try {
      // Clean up expired sessions
      await db
        .delete(adminSessions)
        .where(lt(adminSessions.expiresAt, new Date()));
      
      // Create new session
      await db.insert(adminSessions).values({
        token: hashedToken,
        expiresAt,
      });
    } catch (error) {
      console.error('Error creating session in DB:', error);
      // Continue without DB - session will be cookie-only
    }
  }
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return { success: true };
}

/**
 * Validate session from cookies
 */
export async function validateSession(
  cookieStore?: Awaited<ReturnType<typeof cookies>>
): Promise<{ id: string; valid: boolean } | null> {
  const store = cookieStore ?? await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  const hashedToken = hashToken(token);
  
  if (isDatabaseReady()) {
    try {
      const result = await db
        .select()
        .from(adminSessions)
        .where(eq(adminSessions.token, hashedToken))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const session = result[0];
      
      // Check if expired
      if (new Date(session.expiresAt) < new Date()) {
        // Clean up expired session
        await db.delete(adminSessions).where(eq(adminSessions.id, session.id));
        return null;
      }
      
      return { id: session.id, valid: true };
    } catch (error) {
      console.error('Error validating session:', error);
      // Fall through to cookie-only validation
    }
  }
  
  // Cookie-only validation (when DB not available)
  // Just check if cookie exists and is not empty
  return token ? { id: 'cookie-session', valid: true } : null;
}

/**
 * Check if user is authenticated (for use in server components)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await validateSession();
  return session !== null && session.valid;
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (token && isDatabaseReady()) {
    try {
      const hashedToken = hashToken(token);
      await db
        .delete(adminSessions)
        .where(eq(adminSessions.token, hashedToken));
    } catch (error) {
      console.error('Error deleting session from DB:', error);
    }
  }
  
  // Clear cookie
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Middleware helper - returns redirect URL if not authenticated
 */
export async function requireAuth(): Promise<string | null> {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return '/admin/login';
  }
  return null;
}
