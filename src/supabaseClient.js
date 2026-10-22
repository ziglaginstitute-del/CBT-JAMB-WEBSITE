import { createClient } from "@supabase/supabase-js";

// ============================================================================
// SUPABASE CONFIGURATION
// Replace the values below with your project URL and public anon/publishable key.
// ============================================================================

// 1. Paste your Supabase project URL here:
const SUPABASE_URL = "https://clsztftzcwagjqgzxsxb.supabase.co";

// 2. Paste your Supabase public API key (anon / publishable key) here:
const SUPABASE_PUBLIC_KEY = "sb_publishable_QgDzKrdaPfb8DLXqig5n3w_Kmuzh4Vz";

// ============================================================================
// SUPABASE CLIENT EXPORT
// ============================================================================
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
