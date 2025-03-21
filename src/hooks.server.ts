// hooks.server.ts
import { lucia } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const ipRequests = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

const rateLimit = async (ip: string): Promise<boolean> => {
  const now = Date.now();
  const record = ipRequests.get(ip);
  
  if (!record || now - record.timestamp > RATE_WINDOW) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  record.count += 1;
  if (record.count > RATE_LIMIT) {
    return true; // rate limited
  }
  
  return false;
};

// HTTPS enforcement
const enforceHttps: Handle = async ({ event, resolve }) => {
  if (
    event.request.headers.get("x-forwarded-proto") !== "https" && 
    process.env.NODE_ENV === "production" &&
    !event.url.hostname.includes("localhost")
  ) {
    return new Response("Redirect to HTTPS", {
      status: 301,
      headers: {
        Location: `https://${event.request.headers.get("host")}${event.url.pathname}${event.url.search}`
      }
    });
  }
  return await resolve(event);
};

// Rate limiting middleware
const rateLimitMiddleware: Handle = async ({ event, resolve }) => {
  const ip = event.getClientAddress();
  
  // Skip rate limiting for certain paths if needed
  if (event.url.pathname.startsWith("/public") || event.locals.session) {
    return await resolve(event);
  }
  
  const limited = await rateLimit(ip);
  if (limited) {
    return new Response("Too many requests", { status: 429 });
  }
  
  return await resolve(event);
};

// Auth middleware (your existing code)
const authMiddleware: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  
  if (!sessionId) {
    console.log('No session ID found');
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: ".",
        ...sessionCookie.attributes
      });
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: ".",
        ...sessionCookie.attributes
      });
    }
    event.locals.user = user;
    event.locals.session = session;
  } catch (error) {
    console.error("Error validating session:", error);
    event.locals.user = null;
    event.locals.session = null;
  }
  
  return resolve(event);
};


// Security headers middleware
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  
  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), clipboard-write=(self)");
  
  // Updated Content Security Policy - allowing BoxIcons
  const cspDirectives = [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline' https://unpkg.com", // Added unpkg.com for BoxIcons
    "font-src 'self' https://unpkg.com", // Added for BoxIcons fonts
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api.supabase.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ].join("; ");
  
  response.headers.set("Content-Security-Policy", cspDirectives);
  
  // HSTS header remains the same...
  
  return response;
};

// Combine all middleware with sequence
export const handle = sequence(
  enforceHttps,
  rateLimitMiddleware,
  authMiddleware,
  securityHeaders
);