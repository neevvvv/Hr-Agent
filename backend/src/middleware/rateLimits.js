import rateLimit from 'express-rate-limit';

/**
 * Extract a stable rate-limit key:
 *   - If the request has a valid JWT, use `user:<uid>`
 *   - Otherwise, fall back to the IP address
 */
function userOrIp(req) {
  const auth = req.headers.authorization;

  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = JSON.parse(
        Buffer.from(auth.slice(7).split('.')[1], 'base64').toString()
      );

      if (payload?.uid) {
        return `user:${payload.uid}`;
      }
    } catch {
      // Fall through to IP if token parsing fails
    }
  }

  return req.ip;
}

// =====================================
// Login limiter
// 20 attempts / 15 minutes / IP
// =====================================
export const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================
// Agent limiter
// 20 AI requests / minute / user
// =====================================
export const agentLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: 'Slow down — too many AI requests. Try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIp,
});

// =====================================
// Mutation limiter
// 60 mutations / minute / user
// =====================================
export const mutationLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIp,
});