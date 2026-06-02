import { RateLimiterMemory } from "rate-limiter-flexible";

// 10 new posts (comments or debate replies) per user per minute
export const postLimiter = new RateLimiterMemory({ points: 10, duration: 60 });

// 5 rating submissions per user per minute
export const ratingLimiter = new RateLimiterMemory({ points: 5, duration: 60 });

// 30 username availability checks per IP per minute (prevents enumeration)
export const usernameLookupLimiter = new RateLimiterMemory({ points: 30, duration: 60 });
