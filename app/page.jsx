import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import { toko } from "@/lib/toko";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HalamanKatalog({ searchParams }) {
  const sp = (await searchParams) || {};
  const cari = sp.cari ? String(sp.cari).trim() : "";
  const kategoriDipilih = sp.kategori ? String(sp.kategori).trim() : "";

  let daftarProduk = [];
  let daftarKategori = [];
  let pesanError = null;

  try {
    const supabase = createServerClient();

    let query = supabase.from("produk").select("*");

    if (cari) {
      query = query.ilike("nama", `%${cari}%`);
    }

    if (kategoriDipilih) {
      query = query.eq("kategori", kategoriDipilih);
    }

    query = query.order("id", { ascending: true });

    const [hasilProduk, hasilKategori] = await Promise.all([
      query,
      supabase.from("produk").select("kategori"),
    ]);

    if (hasilProduk.error) {
      pesanError = hasilProduk.error.message;
    } else {
      daftarProduk = hasilProduk.data || [];
    }

    if (hasilKategori.data) {
      daftarKategori = Array.from(
        new Set(hasilKategori.data.map((p) => p.kategori).filter(Boolean))
      ).sort();
    }
  } catch (err) {
    pesanError = err.message || "Gagal memuat produk dari database.";
  }

  return (
    <>
      <section className="py-10 sm:py-14">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {toko.nama}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-teks-lembut">{toko.tagline}</p>
        <p className="mt-4 text-sm text-teks-lembut">{toko.jamBuka}</p>
      </section>

      <section aria-labelledby="judul-produk" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="judul-produk" className="text-xl font-bold">
            Produk kami
          </h2>

          {/* Form Pencarian */}
          <form method="GET" action="/" className="flex items-center gap-2">
            {kategoriDipilih && (
              <input type="hidden" name="kategori" value={kategoriDipilih} />
            )}
            <input
              type="text"
              name="cari"
              defaultValue={cari}
              placeholder="Cari nama produk..."
              className="w-full rounded-lg border border-garis bg-latar px-3 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none sm:w-60"
            />
            <button
              type="submit"
              className="rounded-lg bg-utama px-4 py-2 text-sm font-semibold text-white hover:bg-utama-gelap"
            >
              Cari
            </button>
            {(cari || kategoriDipilih) && (
              <Link
                href="/"
                className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama"
              >
                Reset
              </Link>
            )}
          </form>
        </div>

        {/* Filter Kategori (Pill Chips) */}
        {daftarKategori.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={cari ? `/?cari=${encodeURIComponent(cari)}` : "/"}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
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
                  ? `/?cari=${encodeURIComponent(cari)}`
                  : "/"
                : `/?kategori=${encodeURIComponent(kat)}${
                    cari ? `&cari=${encodeURIComponent(cari)}` : ""
                  }`;

              return (
                <Link
                  key={kat}
                  href={href}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
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

        {pesanError ? (
          <div className="rounded-lg border border-garis bg-permukaan p-4 text-bahaya">
            <p className="font-semibold">Gagal memuat daftar produk</p>
            <p className="mt-1 text-sm text-teks-lembut">{pesanError}</p>
          </div>
        ) : daftarProduk.length === 0 ? (
          <div className="py-10 text-center text-teks-lembut">
            {cari || kategoriDipilih ? (
              <div className="flex flex-col items-center gap-2">
                <p>Tidak ada produk yang sesuai dengan pencarian atau filter kategori.</p>
                <Link
                  href="/"
                  className="text-sm font-semibold text-utama underline underline-offset-4"
                >
                  Lihat semua produk
                </Link>
              </div>
            ) : (
              <p>Belum ada produk</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {daftarProduk.map((produk) => (
              <KartuProduk key={produk.id} produk={produk} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
