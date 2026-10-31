import { createClient } from "@supabase/supabase-js";

/**
 * Membuat koneksi Supabase di sisi server untuk membaca data publik (seperti katalog).
 * Menggunakan SUPABASE_SECRET_KEY untuk melewati RLS pada operasi baca di server.
 */
export function createServerClient() {
  let supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SECRET_KEY belum diisi di environment variable."
    );
  }

  // Bersihkan jika ada /rest/v1 atau trailing slash
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const buatKoneksiServer = createServerClient;

