package com.example.saas.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-user, per-endpoint rate limiter for AI endpoints.
 * Uses Bucket4j token-bucket algorithm: 20 requests per minute per user per action.
 * Buckets are stored in-memory and auto-created on first access (thread-safe).
 */
@Component
public class RateLimitConfig {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Returns (or creates) a rate-limit bucket for the given key.
     * Key format: "ai:{endpoint}:{userId}"
     */
    public Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, k -> newBucket());
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}
