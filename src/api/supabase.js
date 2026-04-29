import { createClient } from '@supabase/supabase-js';

const supabase_url = "https://cfqzteyvvjxtojutzyur.supabase.co";
const supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcXp0ZXl2dmp4dG9qdXR6eXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODA2MTksImV4cCI6MjA4ODM1NjYxOX0.b1Q7e9cqgZ93o6pk5CiEuEP12bVy0ZVViZer2o4xPgM";

export const supabase = createClient(supabase_url, supabase_key);