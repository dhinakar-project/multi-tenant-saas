-- Seed Demo Organization
INSERT INTO tenants (id, slug, name) 
VALUES ('11111111-1111-1111-1111-111111111111', 'demo-org', 'Demo Organization');

-- Seed Users
-- Admin
INSERT INTO users (id, tenant_id, email, password_hash, full_name, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo.org',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a',
    'Demo Admin',
    1
);

INSERT INTO user_roles (user_id, role) VALUES 
('22222222-2222-2222-2222-222222222222', 'TENANT_ADMIN'),
('22222222-2222-2222-2222-222222222222', 'USER_READ'),
('22222222-2222-2222-2222-222222222222', 'USER_WRITE'),
('22222222-2222-2222-2222-222222222222', 'TICKET_READ'),
('22222222-2222-2222-2222-222222222222', 'TICKET_WRITE'),
('22222222-2222-2222-2222-222222222222', 'TICKET_ASSIGN'),
('22222222-2222-2222-2222-222222222222', 'AUDIT_READ'),
('22222222-2222-2222-2222-222222222222', 'ROLE_MANAGE');

-- Agent
INSERT INTO users (id, tenant_id, email, password_hash, full_name, is_active)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'agent@demo.org',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a',
    'Demo Agent',
    1
);

INSERT INTO user_roles (user_id, role) VALUES 
('33333333-3333-3333-3333-333333333333', 'TICKET_READ'),
('33333333-3333-3333-3333-333333333333', 'TICKET_WRITE'),
('33333333-3333-3333-3333-333333333333', 'TICKET_ASSIGN');

-- Viewer
INSERT INTO users (id, tenant_id, email, password_hash, full_name, is_active)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'viewer@demo.org',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAtepPIq0.W9jce.Y27c.Z/O5N.a',
    'Demo Viewer',
    1
);

INSERT INTO user_roles (user_id, role) VALUES 
('44444444-4444-4444-4444-444444444444', 'TICKET_READ');

-- Seed Tickets
INSERT INTO tickets (id, tenant_id, title, description, status, priority, created_by, assignee_id)
VALUES 
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Server crashing on startup', 'Logs show NPE in MainApplication.java', 'Open', 'High', '22222222-2222-2222-2222-222222222222', NULL),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Update logo on homepage', 'Marketing sent new assets', 'InProgress', 'Low', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Forgot password not working', 'User gets 500 error', 'Resolved', 'Urgent', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');
