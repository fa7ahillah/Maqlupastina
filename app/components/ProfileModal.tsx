"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";

interface ProfileModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  userId: string;
  userEmail: string;
}

export default function ProfileModal({
  isOpen,
  onSuccess,
  userId,
  userEmail,
}: ProfileModalProps) {
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("users").upsert({
      id: userId,
      email: userEmail,
      nick_name: nickname,
      phone: phone,
    });

    setLoading(false);
    if (!error) {
      onSuccess();
    } else {
      console.error("Detail Error Supabase:", error);
      alert(`Gagal menyimpan: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
        <h3 className="text-2xl font-bold text-text-main mb-2">
          Lengkapi Data Diri
        </h3>
        <p className="text-text-main/70 text-sm mb-6">
          Masukkan nama panggilan dan nomor WhatsApp untuk konfirmasi pengiriman
          pesanan Maqlupastina.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1">
              Nama Panggilan
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Contoh: Haris"
              // Tambahkan bg-white, text-text-main, dan placeholder-gray-400 di sini
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-text-main placeholder-gray-400 focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              // Tambahkan juga di sini
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-text-main placeholder-gray-400 focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-md text-base mt-2"
          >
            {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </button>
        </form>
      </div>
    </div>
  );
}
