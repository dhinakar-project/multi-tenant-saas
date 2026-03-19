-- V4: make sure comments.updated_at exists

-- MySQL supports IF NOT EXISTS in ADD COLUMN from 8.0.29+, but for safety in scripts we will just run the add directly if we assume it doesn't exist or handle gracefully.
-- However, since this is a migration chain, we assume previous state is known.

-- Check if column exists is hard in pure SQL script without procedures in MySQL. 
-- But since we are rewriting everything, we can just assume it's a fresh run sequence.

ALTER TABLE comments
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Backfill (if we had data, which we might from seed)
UPDATE comments
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;
