package com.example.saas.security;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;

/**
 * Validates Clerk-issued JWTs using JWKS (RS256).
 * NO shared secrets, NO token generation - validation ONLY.
 */
@Slf4j
@Service
public class ClerkJwtValidator {

    private final JwkProvider jwkProvider;
    private final String issuer;

    public ClerkJwtValidator(
            @Value("${clerk.jwks-url}") String jwksUrl,
            @Value("${clerk.issuer}") String issuer) throws Exception {
        this.jwkProvider = new UrlJwkProvider(new URL(jwksUrl));
        this.issuer = issuer;
        log.info("ClerkJwtValidator initialized with JWKS URL: {}", jwksUrl);
    }

    /**
     * Validates Clerk JWT and returns decoded token.
     * Throws exception if invalid.
     */
    public DecodedJWT validateToken(String token) {
        try {
            // 1. Decode JWT to get 'kid' from header
            DecodedJWT jwt = JWT.decode(token);
            String keyId = jwt.getKeyId();

            if (keyId == null) {
                throw new SecurityException("JWT missing 'kid' header");
            }

            // 2. Fetch public key from Clerk JWKS endpoint
            Jwk jwk = jwkProvider.get(keyId);
            RSAPublicKey publicKey = (RSAPublicKey) jwk.getPublicKey();

            // 3. Verify signature and claims
            Algorithm algorithm = Algorithm.RSA256(publicKey, null);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(issuer)
                    .acceptLeeway(5) // 5 seconds leeway for clock skew
                    .build();

            DecodedJWT verified = verifier.verify(token);

            // 4. Additional validation
            if (verified.getExpiresAt().before(new Date())) {
                throw new SecurityException("JWT expired");
            }

            log.debug("Clerk JWT validated successfully for sub: {}", verified.getSubject());
            return verified;

        } catch (Exception e) {
            log.error("Clerk JWT validation failed: {}", e.getMessage());
            throw new SecurityException("Invalid Clerk JWT: " + e.getMessage(), e);
        }
    }

    /**
     * Extract Clerk user ID (sub claim) from validated token.
     */
    public String extractClerkUserId(DecodedJWT jwt) {
        return jwt.getSubject();
    }

    /**
     * Extract email from Clerk JWT.
     * Tries multiple claim names since Clerk JWT template can use different keys.
     * Returns null if not present (no email claim configured in Clerk JWT template).
     */
    public String extractEmail(DecodedJWT jwt) {
        // Standard claim added via Clerk JWT template
        String email = safeClaimString(jwt, "email");
        if (email != null) return email;
        // Alternative key some templates use
        email = safeClaimString(jwt, "primary_email_address");
        if (email != null) return email;
        return null;
    }

    /**
     * Extract full name from Clerk JWT (if present).
     *
     * Checks multiple claim names to handle both default Clerk JWTs and
     * custom session token templates. Returns null (never a Clerk user ID)
     * so that callers can fall back to email-derived names safely.
     */
    public String extractFullName(DecodedJWT jwt) {
        // Try first_name + last_name (set via Clerk session token template)
        String firstName = safeClaimString(jwt, "first_name");
        String lastName  = safeClaimString(jwt, "last_name");

        // Also check OpenID standard claim names as secondary option
        if (firstName == null) firstName = safeClaimString(jwt, "given_name");
        if (lastName  == null) lastName  = safeClaimString(jwt, "family_name");

        if (firstName != null || lastName != null) {
            String combined = ((firstName != null ? firstName : "") + " " +
                               (lastName  != null ? lastName  : "")).trim();
            return combined.isEmpty() ? null : combined;
        }

        // Try full_name or name as last resort, but reject Clerk-ID-looking values
        String fullName = safeClaimString(jwt, "full_name");
        if (fullName == null) fullName = safeClaimString(jwt, "name");

        return isClerkIdLike(fullName) ? null : fullName;
    }

    /**
     * Returns the claim as a non-blank String, or null.
     */
    private String safeClaimString(DecodedJWT jwt, String claim) {
        try {
            String val = jwt.getClaim(claim).asString();
            return (val == null || val.isBlank()) ? null : val.trim();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Returns true when the string looks like a Clerk user ID or random token
     * rather than a human name — e.g. "user_3cieqgmntiqwdyatvfppngqimxs".
     */
    private boolean isClerkIdLike(String value) {
        if (value == null) return false;
        // Matches "user_<alphanum>" or any 20+ char lowercase-alphanum-only string
        return value.toLowerCase().startsWith("user_")
                || value.matches("[a-z0-9]{20,}");
    }
}
