export function rateLimit({ windowMs, max, message = 'Too many requests. Please try again later.' }) {
  const buckets = new Map();
  let requestsSinceCleanup = 0;

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) bucket = { count: 0, resetAt: now + windowMs };

    if (bucket.count >= max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ error: message });
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.set('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 1000) {
      for (const [address, item] of buckets) if (now >= item.resetAt) buckets.delete(address);
      requestsSinceCleanup = 0;
    }
    next();
  };
}
