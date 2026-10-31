import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Membuat koneksi Supabase berbasis sesi admin dengan @supabase/ssr dan cookies.
 * Menggunakan SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  let supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY belum diisi di environment variable."
    );
  }

  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Abaikan jika dipanggil dari Server Component saat render
        }
      },
    },
  });
}

export const createAuthClient = createSessionClient;
export const createAdminSessionClient = createSessionClient;

