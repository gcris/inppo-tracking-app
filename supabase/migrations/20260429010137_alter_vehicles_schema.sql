-- Alter vehicles table to add personnel_id and remove unit_name, assigned_officer
ALTER TABLE vehicles ADD COLUMN personnel_id uuid REFERENCES personnel(id) ON DELETE SET NULL;
ALTER TABLE vehicles DROP COLUMN unit_name;
ALTER TABLE vehicles DROP COLUMN assigned_officer;