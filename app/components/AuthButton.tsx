"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Memeriksa status login kustomer saat halaman dimuat
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // Memicu jendela login Google dari Supabase
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // Memicu proses logout dan memuat ulang halaman
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // 1. TAMPILAN JIKA SUDAH LOGIN (Avatar Oranye)
  if (user) {
    return (
      <div className="flex items-center gap-4">
        {/* Lingkaran Avatar menggunakan warna Accent (#F59E0B) */}
        <div
          className="w-11 h-11 bg-accent rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-white font-bold cursor-help"
          title={user.email} // Menampilkan email asli saat di-hover
        >
          {/* Mengambil huruf pertama dari email sebagai inisial di dalam avatar */}
          {user.email?.charAt(0).toUpperCase()}
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-text-main/50 hover:text-warning transition-colors"
        >
          Keluar
        </button>
      </div>
    );
  }

  // 2. TAMPILAN JIKA BELUM LOGIN (Kotak Login/Daftar)
  return (
    <button
      onClick={handleLogin}
      className="h-11 px-6 bg-white border border-text-main/50 text-text-main rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm font-sans"
    >
      Masuk/Daftar
    </button>
  );
}
