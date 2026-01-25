-- Seed Demo Organization
INSERT INTO tenants (id, slug, name) 
VALUES ('11111111-1111-1111-1111-111111111111', 'demo-org', 'Demo Organization');

-- Seed Users (Password is 'Admin@123' BCrypt encoded)
-- Passwords generated via BCrypt: $2a$10$wT.f.D/X/u... (using a placeholder hash for example)
-- Let's use a standard hash for 'Admin@123': $2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a (Standard BCrypt)

-- Admin
INSERT INTO users (id, tenant_id, email, password_hash, full_name, roles)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo.org',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a', -- Admin@123
    'Demo Admin',
    '{TENANT_ADMIN,USER_READ,USER_WRITE,TICKET_READ,TICKET_WRITE,TICKET_ASSIGN,AUDIT_READ,ROLE_MANAGE}'
);

-- Agent
INSERT INTO users (id, tenant_id, email, password_hash, full_name, roles)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'agent@demo.org',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a',
    'Demo Agent',
    '{TICKET_READ,TICKET_WRITE,TICKET_ASSIGN}'
);

-- Viewer
INSERT INTO users (id, tenant_id, email, password_hash, full_name, roles)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'viewer@demo.org',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a',
    'Demo Viewer',
    '{TICKET_READ}'
);

-- Seed Tickets
INSERT INTO tickets (tenant_id, title, description, status, priority, created_by, assignee_id)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Server crashing on startup', 'Logs show NPE in MainApplication.java', 'Open', 'High', '22222222-2222-2222-2222-222222222222', NULL),
('11111111-1111-1111-1111-111111111111', 'Update logo on homepage', 'Marketing sent new assets', 'InProgress', 'Low', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
('11111111-1111-1111-1111-111111111111', 'Forgot password not working', 'User gets 500 error', 'Resolved', 'Urgent', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');
