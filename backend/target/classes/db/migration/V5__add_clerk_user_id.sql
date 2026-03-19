-- Add Clerk user ID mapping to users table
ALTER TABLE users ADD COLUMN clerk_user_id VARCHAR(255) UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);

-- Make password nullable (Clerk handles authentication)
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
