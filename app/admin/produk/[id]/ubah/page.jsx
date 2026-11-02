import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { ubahProduk } from "@/app/admin/actions";
import { createSessionClient } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;
  let produk = null;

  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      produk = data;
    } else {
      const fallbackClient = createServerClient();
      const fallback = await fallbackClient
        .from("produk")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!fallback.error && fallback.data) {
        produk = fallback.data;
      }
    }
  } catch {
    // Abaikan dan lanjut cek keberadaan produk
  }

  if (!produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ubah produk</h1>
      <FormProduk
        produk={produk}
        labelTombol="Simpan perubahan"
        action={ubahProduk}
      />
    </div>
  );
}
