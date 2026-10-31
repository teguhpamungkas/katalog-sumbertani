"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/auth";

export async function login(prevStateOrFormData, formDataArg) {
  const formData =
    formDataArg instanceof FormData ? formDataArg : prevStateOrFormData;

  const email = formData?.get("email")?.toString().trim();
  const password = formData?.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  let supabase;
  try {
    supabase = await createSessionClient();
  } catch (err) {
    return { error: err.message || "Gagal membuat koneksi sesi admin." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let pesan = error.message;
    if (
      pesan === "Invalid login credentials" ||
      pesan.toLowerCase().includes("invalid login")
    ) {
      pesan = "Email atau password salah.";
    }
    return { error: pesan };
  }

  redirect("/admin");
}

export async function keluar() {
  try {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  } catch {
    // Abaikan error jika sesi sudah tidak ada
  }

  redirect("/admin/login");
}

export const logout = keluar;

export async function gantiPassword(prevStateOrFormData, formDataArg) {
  const formData =
    formDataArg instanceof FormData ? formDataArg : prevStateOrFormData;

  const passwordBaru = formData?.get("password_baru")?.toString() || "";
  const konfirmasiPassword =
    formData?.get("konfirmasi_password")?.toString() || "";

  if (!passwordBaru || !konfirmasiPassword) {
    return { error: "Semua kolom password wajib diisi." };
  }

  if (passwordBaru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (passwordBaru !== konfirmasiPassword) {
    return { error: "Konfirmasi password tidak sama dengan password baru." };
  }

  let supabase;
  try {
    supabase = await createSessionClient();
  } catch (err) {
    return { error: err.message || "Gagal membuat koneksi sesi admin." };
  }

  // Periksa apakah admin sedang login (aturan keamanan)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sesi admin telah berakhir. Silakan login kembali." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (updateError) {
    return {
      error: updateError.message || "Gagal mengganti password.",
    };
  }

  return {
    success: true,
    message: "Password berhasil diganti.",
  };
}

export const changePassword = gantiPassword;
