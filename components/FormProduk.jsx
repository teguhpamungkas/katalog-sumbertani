"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";

// Dipakai untuk tambah produk (US-08) dan ubah produk (US-09).
// Nama field sama dengan kolom tabel "produk".
export default function FormProduk({ produk = {}, labelTombol, action }) {
  const [state, formAction, isPending] = useActionState(
    action || (() => {}),
    null
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}

      {produk?.id && <input type="hidden" name="id" value={produk.id} />}

      <Input label="Nama produk" name="nama" defaultValue={produk.nama} required />

      <Input
        label="Harga (Rp)"
        name="harga"
        type="number"
        min="0"
        defaultValue={produk.harga}
        required
      />

      <Input label="Kategori" name="kategori" defaultValue={produk.kategori} />

      <div className="flex flex-col gap-1.5 text-sm font-semibold">
        <label htmlFor="foto">Upload foto produk</label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2 text-sm text-teks file:mr-3 file:rounded-md file:border-0 file:bg-permukaan file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-teks hover:file:bg-garis focus:border-utama focus:outline-none"
        />
        <p className="text-xs font-normal text-teks-lembut">
          Pilih file gambar (JPG, PNG, WEBP, atau SVG). Maksimal 5 MB.
        </p>

        {produk.foto_url && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={produk.foto_url}
              alt="Foto saat ini"
              className="h-14 w-14 rounded-lg border border-garis bg-permukaan object-cover"
            />
            <div className="flex flex-col">
              <span className="text-xs font-normal text-teks-lembut">
                Foto saat ini (biarkan kosong jika tidak ingin mengubah foto)
              </span>
              <input type="hidden" name="foto_url_lama" value={produk.foto_url} />
            </div>
          </div>
        )}
      </div>

      <Input label="Deskripsi" name="deskripsi" textarea defaultValue={produk.deskripsi} />

      <div className="flex gap-3">
        <Tombol type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : labelTombol}
        </Tombol>
        <Tombol href="/admin" varian="garis">
          Batal
        </Tombol>
      </div>
    </form>
  );
}
