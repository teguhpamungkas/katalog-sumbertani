"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";

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

/**
 * Mengunggah file foto produk ke Supabase Storage (bucket "produk") dari sisi server.
 */
async function uploadFotoProduk(file) {
  // 1. Validasi tipe file
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error(
      "File yang diunggah harus berupa gambar (JPG, PNG, WEBP, atau SVG)."
    );
  }

  // 2. Validasi ukuran file (maksimal 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran file foto maksimal 5 MB.");
  }

  const supabaseAdmin = createServerClient();
  const bucketName = "produk";

  // Pastikan bucket "produk" ada dan publik
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === bucketName);
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
      });
    }
  } catch {
    // Abaikan jika pengecekan bucket gagal (akan dicoba upload langsung)
  }

  // Buat nama file unik
  const originalExt = file.name.split(".").pop()?.toLowerCase();
  const ekstensi = originalExt || "jpg";
  const namaFile = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ekstensi}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(namaFile, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah foto ke storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(namaFile);

  return publicUrlData.publicUrl;
}

export async function tambahProduk(prevStateOrFormData, formDataArg) {
  const formData =
    formDataArg instanceof FormData ? formDataArg : prevStateOrFormData;

  const nama = formData?.get("nama")?.toString().trim();
  const hargaRaw = formData?.get("harga")?.toString().trim();
  const kategori = formData?.get("kategori")?.toString().trim() || null;
  const deskripsi = formData?.get("deskripsi")?.toString().trim() || null;
  const fotoFile = formData?.get("foto");

  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const harga = parseInt(hargaRaw, 10);
  if (isNaN(harga) || harga < 0) {
    return { error: "Harga produk harus berupa angka positif." };
  }

  let supabase;
  try {
    supabase = await createSessionClient();
  } catch (err) {
    return { error: err.message || "Gagal membuat koneksi sesi admin." };
  }

  // Periksa apakah admin sedang login (aturan keamanan nomor 3)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  let fotoUrl = formData?.get("foto_url_lama")?.toString().trim() || null;

  // Jika ada file foto yang dipilih, unggah ke Supabase Storage
  if (
    fotoFile &&
    typeof fotoFile === "object" &&
    fotoFile.size > 0 &&
    fotoFile.name
  ) {
    try {
      fotoUrl = await uploadFotoProduk(fotoFile);
    } catch (err) {
      return { error: err.message || "Gagal mengunggah foto produk." };
    }
  }

  const { error: insertError } = await supabase.from("produk").insert({
    nama,
    harga,
    kategori,
    foto_url: fotoUrl,
    deskripsi,
  });

  if (insertError) {
    return {
      error: insertError.message || "Gagal menyimpan produk baru ke database.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function ubahProduk(prevStateOrFormData, formDataArg) {
  const formData =
    formDataArg instanceof FormData ? formDataArg : prevStateOrFormData;

  const id = formData?.get("id")?.toString();
  const nama = formData?.get("nama")?.toString().trim();
  const hargaRaw = formData?.get("harga")?.toString().trim();
  const kategori = formData?.get("kategori")?.toString().trim() || null;
  const deskripsi = formData?.get("deskripsi")?.toString().trim() || null;
  const fotoFile = formData?.get("foto");

  if (!id) {
    return { error: "ID produk tidak valid." };
  }

  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const harga = parseInt(hargaRaw, 10);
  if (isNaN(harga) || harga < 0) {
    return { error: "Harga produk harus berupa angka positif." };
  }

  let supabase;
  try {
    supabase = await createSessionClient();
  } catch (err) {
    return { error: err.message || "Gagal membuat koneksi sesi admin." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  let fotoUrl = formData?.get("foto_url_lama")?.toString().trim() || null;

  if (
    fotoFile &&
    typeof fotoFile === "object" &&
    fotoFile.size > 0 &&
    fotoFile.name
  ) {
    try {
      fotoUrl = await uploadFotoProduk(fotoFile);
    } catch (err) {
      return { error: err.message || "Gagal mengunggah foto produk." };
    }
  }

  const { error: updateError } = await supabase
    .from("produk")
    .update({
      nama,
      harga,
      kategori,
      foto_url: fotoUrl,
      deskripsi,
    })
    .eq("id", id);

  if (updateError) {
    return {
      error: updateError.message || "Gagal memperbarui data produk.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);
  redirect("/admin");
}


export async function hapusProduk(prevStateOrFormData, formDataArg) {
  const formData =
    formDataArg instanceof FormData ? formDataArg : prevStateOrFormData;

  let id;
  if (formData instanceof FormData) {
    id = formData.get("id")?.toString();
  } else if (typeof formData === "string" || typeof formData === "number") {
    id = formData.toString();
  }

  if (!id) {
    return { error: "ID produk tidak valid." };
  }

  let supabase;
  try {
    supabase = await createSessionClient();
  } catch (err) {
    return { error: err.message || "Gagal membuat koneksi sesi admin." };
  }

  // Periksa apakah admin sedang login (aturan keamanan nomor 3)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  const { error: deleteError } = await supabase
    .from("produk")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return {
      error: deleteError.message || "Gagal menghapus produk dari database.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
