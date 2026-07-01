-- Migration 013: allow admin to mark a company inactive or soft-delete it (with restore), mirroring students' Kosz pattern

ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
