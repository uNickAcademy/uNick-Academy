-- Migration 014: let teachers register their own WhatsApp number for the WhatsApp messaging feature

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS whatsapp_phone text;
