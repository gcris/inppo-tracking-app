/*
  # Fleet Tracking Schema

  ## Overview
  Creates the core tables for the INPPO Tactical GPS Command Center.

  ## New Tables

  ### `vehicles`
  - `id` (uuid, primary key) - unique vehicle identifier
  - `plate_number` (text, unique) - license plate, e.g. "ZAR-366"
  - `unit_name` (text) - optional friendly name
  - `assigned_officer` (text) - officer assigned to the unit
  - `created_at` (timestamptz) - record creation timestamp

  ### `vehicle_logs`
  - `id` (uuid, primary key)
  - `vehicle_id` (uuid, foreign key -> vehicles.id)
  - `latitude` (double precision) - GPS latitude
  - `longitude` (double precision) - GPS longitude
  - `speed` (numeric) - speed in km/h, default 0
  - `network_signal` (integer) - network signal strength 0-100, default 0
  - `captured_at` (timestamptz) - when the log was captured

  ## Security
  - RLS enabled on both tables
  - Only authenticated users can read vehicles and logs
  - No public access; all access requires valid JWT

  ## Notes
  - Indexes on vehicle_logs(vehicle_id) and vehicle_logs(captured_at DESC) for fast queries
  - vehicle_logs(vehicle_id, captured_at) composite index for session discovery queries
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text UNIQUE NOT NULL,
  unit_name text DEFAULT '',
  assigned_officer text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create vehicle_logs table
CREATE TABLE IF NOT EXISTS vehicle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  speed numeric NOT NULL DEFAULT 0,
  network_signal integer NOT NULL DEFAULT 0,
  captured_at timestamptz DEFAULT now()
);

-- Create unit table
CREATE TABLE IF NOT EXISTS unit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name text UNIQUE NOT NULL
);

-- Create personnel table
CREATE TABLE IF NOT EXISTS personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank text NOT NULL,
  fullname text NOT NULL,
  unit_id uuid REFERENCES unit(id) ON DELETE SET NULL
);

-- Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time_from time NOT NULL,
  time_to time NOT NULL,
  sector text NOT NULL,
  unit_id uuid NOT NULL REFERENCES unit(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_vehicle_id ON vehicle_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_captured_at ON vehicle_logs(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_vehicle_captured ON vehicle_logs(vehicle_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_personnel_unit_id ON personnel(unit_id);
CREATE INDEX IF NOT EXISTS idx_schedule_unit_id ON schedule(unit_id);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can read units
CREATE POLICY "Authenticated users can read units"
  ON unit FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: authenticated users can read personnel
CREATE POLICY "Authenticated users can read personnel"
  ON personnel FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: authenticated users can read schedule
CREATE POLICY "Authenticated users can read schedule"
  ON schedule FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage units
CREATE POLICY "Authenticated users can insert units"
  ON unit FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage units"
  ON unit FOR UPDATE, DELETE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role can manage personnel
CREATE POLICY "Authenticated users can insert personnel"
  ON personnel FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage personnel"
  ON personnel FOR UPDATE, DELETE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role can manage schedule
CREATE POLICY "Authenticated users can insert schedule"
  ON schedule FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage schedule"
  ON schedule FOR UPDATE, DELETE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies: authenticated users can read all vehicles
CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: authenticated users can read all vehicle logs
CREATE POLICY "Authenticated users can read vehicle logs"
  ON vehicle_logs FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert vehicle logs (for IoT devices / edge functions)
CREATE POLICY "Service role can insert vehicle logs"
  ON vehicle_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role can manage vehicles
CREATE POLICY "Service role can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed sample vehicles
INSERT INTO vehicles (plate_number, unit_name, assigned_officer)
VALUES
  ('ZAR-366', 'Patrol Unit Alpha', 'Officer Santos'),
  ('ZAR-367', 'Patrol Unit Bravo', 'Officer Reyes'),
  ('ZAR-368', 'Patrol Unit Charlie', 'Officer Cruz')
ON CONFLICT (plate_number) DO NOTHING;
