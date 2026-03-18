-- Create projects table
CREATE TABLE projects (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description LONGTEXT,
    owner_id CHAR(36),
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Add index for tenant isolation
CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- Alter tickets table to support grouping by project and tracking SLA (due date)
ALTER TABLE tickets ADD COLUMN project_id CHAR(36) NULL;
ALTER TABLE tickets ADD COLUMN due_date DATETIME NULL;

-- Add foreign key constraint for project_id
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_project FOREIGN KEY (project_id) REFERENCES projects(id);
