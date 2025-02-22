import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://couvdshedcmsvofxouuz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdXZkc2hlZGNtc3ZvZnhvdXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMDM0NTUsImV4cCI6MjA1NTc3OTQ1NX0.9F6t2Tn5q6E8YPA9EoU6tXUGfSA0PbQ9UrvZMFXkXKk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
