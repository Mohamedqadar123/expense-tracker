import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

// express-rate-limit's default MemoryStore only tracks counts within the
// single process that received the request. That's fine for one server
// instance, but once you run more than one (needed to scale past what a
// single process can handle), each instance enforces the limit
// independently — a user's requests can round-robin across instances and
// get roughly (limit × instance count) requests through before any single
// instance notices. A shared store fixes that by keeping one count per key
// in Redis, visible to every instance.
//
// Activates automatically once REDIS_URL is set (e.g. after provisioning a
// Redis instance on your hosting platform); with no REDIS_URL, every
// limiter below falls back to express-rate-limit's in-memory default,
// so local development is unaffected.
let sharedClient = null;

function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (!sharedClient) {
    sharedClient = new Redis(process.env.REDIS_URL, {
      // express-rate-limit calls store methods on every request; failing
      // fast (rather than Redis's default unlimited retry) means a Redis
      // outage degrades to "rate limiting briefly unavailable" instead of
      // piling up a request queue.
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    sharedClient.on('error', (err) => {
      console.error('[rateLimitStore] Redis connection error:', err.message);
    });
  }
  return sharedClient;
}

// Returns a RedisStore for express-rate-limit's `store` option, or
// `undefined` (meaning "use the default MemoryStore") when REDIS_URL isn't
// configured. `prefix` keeps each limiter's keys in its own namespace so
// the login, general-API, and Finance-AI limiters never collide.
export function createRateLimitStore(prefix) {
  const client = getClient();
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args) => client.call(...args),
  });
}
