import Link from "next/link";
import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { createSessionClient } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HalamanAdmin({ searchParams }) {
  const sp = (await searchParams) || {};
  const cari = sp.cari ? String(sp.cari).trim() : "";
  const kategoriDipilih = sp.kategori ? String(sp.kategori).trim() : "";

  let daftarProduk = [];
  let daftarKategori = [];
  let pesanError = null;

  try {
    const supabase = await createSessionClient();
    let query = supabase.from("produk").select("*");

    if (cari) {
      query = query.ilike("nama", `%${cari}%`);
    }

    if (kategoriDipilih) {
      query = query.eq("kategori", kategoriDipilih);
    }

    query = query.order("id", { ascending: true });

    let { data, error } = await query;

    if (error) {
      // Fallback ke server client jika terjadi kendala pada sesi
      const fallbackClient = createServerClient();
      let fbQuery = fallbackClient.from("produk").select("*");
      if (cari) fbQuery = fbQuery.ilike("nama", `%${cari}%`);
      if (kategoriDipilih) fbQuery = fbQuery.eq("kategori", kategoriDipilih);
      fbQuery = fbQuery.order("id", { ascending: true });

      const fallback = await fbQuery;
      if (fallback.error) {
        pesanError = error.message || fallback.error.message;
      } else {
        daftarProduk = fallback.data || [];
      }
    } else {
      daftarProduk = data || [];
    }

    // Ambil daftar kategori unik
    const { data: katData } = await supabase.from("produk").select("kategori");
    if (katData) {
      daftarKategori = Array.from(
        new Set(katData.map((p) => p.kategori).filter(Boolean))
      ).sort();
    }
  } catch (err) {
    pesanError = err.message || "Gagal memuat produk dari database.";
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
      </div>

      {/* Form Pencarian & Filter Kategori di Admin */}
      <div className="flex flex-col gap-4 rounded-xl border border-garis bg-permukaan p-4">
        <form method="GET" action="/admin" className="flex flex-wrap items-center gap-2">
          {kategoriDipilih && (
            <input type="hidden" name="kategori" value={kategoriDipilih} />
          )}
          <input
            type="text"
            name="cari"
            defaultValue={cari}
            placeholder="Cari nama produk..."
            className="min-w-[200px] flex-1 rounded-lg border border-garis bg-latar px-3 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-utama px-4 py-2 text-sm font-semibold text-white hover:bg-utama-gelap"
          >
            Cari
          </button>
          {(cari || kategoriDipilih) && (
            <Link
              href="/admin"
              className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama"
            >
              Reset
            </Link>
          )}
        </form>

        {daftarKategori.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-garis/60 pt-2">
            <span className="text-xs font-semibold text-teks-lembut">Kategori:</span>
            <Link
              href={cari ? `/admin?cari=${encodeURIComponent(cari)}` : "/admin"}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                !kategoriDipilih
                  ? "bg-utama text-white"
                  : "border border-garis bg-latar text-teks hover:border-utama hover:text-utama"
              }`}
            >
              Semua
            </Link>
            {daftarKategori.map((kat) => {
              const isAktif = kategoriDipilih === kat;
              const href = isAktif
                ? cari
                  ? `/admin?cari=${encodeURIComponent(cari)}`
                  : "/admin"
                : `/admin?kategori=${encodeURIComponent(kat)}${
                    cari ? `&cari=${encodeURIComponent(cari)}` : ""
                  }`;

              return (
                <Link
                  key={kat}
                  href={href}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    isAktif
                      ? "bg-utama text-white"
                      : "border border-garis bg-latar text-teks hover:border-utama hover:text-utama"
                  }`}
                >
                  {kat}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {pesanError ? (
        <div className="rounded-lg border border-garis bg-permukaan p-4 text-bahaya">
          <p className="font-semibold">Gagal memuat daftar produk</p>
          <p className="mt-1 text-sm text-teks-lembut">{pesanError}</p>
        </div>
      ) : daftarProduk.length === 0 ? (
        <div className="rounded-2xl border border-garis p-8 text-center text-teks-lembut">
          {cari || kategoriDipilih ? (
            <div className="flex flex-col items-center gap-2">
              <p>Tidak ada produk yang cocok dengan pencarian atau filter kategori.</p>
              <Link
                href="/admin"
                className="text-sm font-semibold text-utama underline underline-offset-4"
              >
                Lihat semua produk
              </Link>
            </div>
          ) : (
            <p>Belum ada produk di database.</p>
          )}
        </div>
      ) : (
        <TabelProduk daftarProduk={daftarProduk} />
      )}
    </div>
  );
}
