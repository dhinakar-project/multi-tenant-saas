-- V12: Add AI categorization fields to tickets table
ALTER TABLE tickets ADD COLUMN ai_suggested_priority VARCHAR(50) NULL AFTER ai_category;
ALTER TABLE tickets ADD COLUMN ai_confidence DECIMAL(4,2) NULL AFTER ai_suggested_priority;
ALTER TABLE tickets ADD COLUMN ai_reasoning VARCHAR(500) NULL AFTER ai_confidence;
ALTER TABLE tickets ADD COLUMN ai_status VARCHAR(20) DEFAULT 'PENDING' AFTER ai_reasoning;
