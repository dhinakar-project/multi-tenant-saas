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
     * Extract email from Clerk JWT (if present).
     */
    public String extractEmail(DecodedJWT jwt) {
        return jwt.getClaim("email").asString();
    }

    /**
     * Extract full name from Clerk JWT (if present).
     */
    public String extractFullName(DecodedJWT jwt) {
        String firstName = jwt.getClaim("given_name").asString();
        String lastName = jwt.getClaim("family_name").asString();

        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }

        // Fallback to name claim
        return jwt.getClaim("name").asString();
    }
}
