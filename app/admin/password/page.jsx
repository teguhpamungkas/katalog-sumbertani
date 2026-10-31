"use client";

import { useActionState } from "react";
import NavAdmin from "@/components/NavAdmin";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { gantiPassword } from "@/app/admin/actions";

export default function HalamanGantiPassword() {
  const [state, formAction, isPending] = useActionState(gantiPassword, null);

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-extrabold">Ganti password</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Ganti password bawaan segera setelah pertama kali masuk. Minimal 8 karakter.
        </p>
      </div>
      <form action={formAction} className="flex max-w-sm flex-col gap-4">
        {state?.error && (
          <p className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="rounded-lg border border-garis bg-permukaan p-3 text-sm font-medium text-utama">
            {state.message || "Password berhasil diganti."}
          </p>
        )}
        <Input
          label="Password baru"
          name="password_baru"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          label="Ulangi password baru"
          name="konfirmasi_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Tombol type="submit" className="self-start" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan password"}
        </Tombol>
      </form>
    </div>
  );
}
