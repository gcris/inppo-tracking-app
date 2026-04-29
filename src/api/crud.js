import { supabase } from "./supabase";

export async function createUnit({ unit_name }) {
  const { data, error } = await supabase
    .from("unit")
    .insert([{ unit_name }])
    .select();
  return { data, error };
}

export async function getUnits() {
  const { data, error } = await supabase.from("unit").select("*");
  return { data, error };
}

export async function getUnitById(id) {
  const { data, error } = await supabase
    .from("unit")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function updateUnit(id, updates) {
  const { data, error } = await supabase
    .from("unit")
    .update(updates)
    .eq("id", id)
    .select();
  return { data, error };
}

export async function deleteUnit(id) {
  const { data, error } = await supabase
    .from("unit")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}

export async function createPersonnel({ rank, fullname, unit_id }) {
  const { data, error } = await supabase
    .from("personnel")
    .insert([{ rank, fullname, unit_id }])
    .select();
  return { data, error };
}

export async function getPersonnel() {
  const { data, error } = await supabase.from("personnel").select("*");
  return { data, error };
}

export async function getPersonnelById(id) {
  const { data, error } = await supabase
    .from("personnel")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function updatePersonnel(id, updates) {
  const { data, error } = await supabase
    .from("personnel")
    .update(updates)
    .eq("id", id)
    .select();
  return { data, error };
}

export async function deletePersonnel(id) {
  const { data, error } = await supabase
    .from("personnel")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}

export async function createVehicle({ plate_number, unit_id, personnel_id }) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert([{ plate_number, unit_id, personnel_id }])
    .select();
  return { data, error };
}

export async function getVehicles() {
  const { data, error } = await supabase.from("vehicles").select(`
      *,
      personnel:personnel_id (
        id,
        rank,
        fullname
      ),
      unit:unit_id (
        id,
        unit_name
      )
    `);
  return { data, error };
}

export async function getVehicleById(id) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function updateVehicle(id, updates) {
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id).select(`
      *,
      personnel:personnel_id (
        id,
        rank,
        fullname
      ),
      unit:unit_id (
        id,
        unit_name
      )
    `);
  return { data, error };
}

export async function deleteVehicle(id) {
  const { data, error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}

export async function createSchedule({
  date,
  time_from,
  time_to,
  sector,
  unit_id,
  personnel_id,
}) {
  const { data, error } = await supabase
    .from("schedule")
    .insert([{ date, time_from, time_to, sector, unit_id, personnel_id }])
    .select();
  return { data, error };
}

export async function createSchedules(schedules) {
  const { data, error } = await supabase
    .from("schedule")
    .insert(schedules)
    .select();
  return { data, error };
}

export async function getSchedules() {
  const { data, error } = await supabase.from("schedule").select("*");
  return { data, error };
}

export async function getScheduleById(id) {
  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function updateSchedule(id, updates) {
  const { data, error } = await supabase
    .from("schedule")
    .update(updates)
    .eq("id", id)
    .select();
  return { data, error };
}

export async function deleteSchedule(id) {
  const { data, error } = await supabase
    .from("schedule")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}
