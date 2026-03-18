-- V10: Add ai_category column to tickets table
-- ai_category: Stores the AI-suggested category from Gemini at ticket creation time

ALTER TABLE tickets
    ADD COLUMN ai_category VARCHAR(100) NULL AFTER project_id;
