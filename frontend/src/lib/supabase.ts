import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yvugjugqtlaktbauqcos.supabase.co";
const supabaseAnonKey = "sb_publishable_6tCyM4RscyRJtupfBMYO_A_AX8OIGBE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
