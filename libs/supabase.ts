import { createClient } from "@supabase/supabase-js"

// ดึงค่า URL และ Anon Key จากไฟล์ .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// สร้าง Instance ของ Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)