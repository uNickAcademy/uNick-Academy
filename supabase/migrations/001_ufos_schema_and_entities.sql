-- Migration 001: Schemat ufos + podmioty prawne
-- Zastosowane: 2026-06-16

CREATE SCHEMA IF NOT EXISTS ufos;

CREATE TABLE ufos.entities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  short_name    text NOT NULL,
  type          text NOT NULL CHECK (type IN ('sp_zoo', 'fundacja')),
  nip           text UNIQUE,
  krs           text,
  regon         text,
  address       jsonb,
  color         text DEFAULT '#1C2B4A',
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

INSERT INTO ufos.entities (name, short_name, type, nip, krs, regon, address, color) VALUES
(
  'UNICK ACADEMY INTERNATIONAL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
  'UAI', 'sp_zoo', '7812067015', '0001093339', '528044862',
  '{"street": "Nowa 23", "city": "Rumianek", "postal_code": "62-080", "country": "Polska"}'::jsonb,
  '#1C2B4A'
),
(
  'UNICK ACADEMY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
  'UA', 'sp_zoo', '7812028328', '0000934614', '520523959', NULL, '#2E4A7A'
),
(
  'Fundacja uNick Academy Foundation',
  'Fundacja', 'fundacja', '7812102071', NULL, NULL, NULL, '#4A6FA5'
);
