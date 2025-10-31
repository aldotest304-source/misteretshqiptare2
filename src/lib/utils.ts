import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/supabaseClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if the logged-in user is an approved admin
 */
export async function checkAdminAccess() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return false

    const { data, error } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}

