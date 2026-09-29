"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";

interface ProfileModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void; // Prop baru untuk tombol Batal
  userId: string;
  userEmail: string;
}

export default function ProfileModal({
  isOpen,
  onSuccess,
  onClose,
  userId,
  userEmail,
}: ProfileModalProps) {
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMsg(
        "Format nomor WhatsApp tidak valid. Gunakan format yang benar, contoh: 08123456789",
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("users").upsert(
      {
        id: userId,
        email: userEmail,
        nick_name: nickname,
        phone: phone,
      },
      {
        onConflict: "id",
      },
    );

    setLoading(false);

    if (!error) {
      onSuccess();
    } else {
      console.error("Detail Error Supabase:", error);
      setErrorMsg(`Gagal menyimpan: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-100 transform animate-scaleUp font-sans">
        <h3 className="text-2xl font-extrabold text-text-main mb-2 font-sans">
          Ubah Identitas
        </h3>
        <p className="text-sm text-text-main/70 mb-6 leading-relaxed font-sans">
          Masukkan nama dan nomor WhatsApp aktif untuk konfirmasi pesanan dan
          pengantaran.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl font-sans">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
          <div>
            <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider font-sans">
              Nama Panggilan
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Contoh: Fatahillah"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider font-sans">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm disabled:opacity-50 font-sans"
          >
            {loading ? "Menyimpan..." : "Simpan Identitas"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-text-main/70 hover:text-text-main underline font-sans mt-1"
          >
            Batal
          </button>
        </form>
      </div>
    </div>
  );
}
