"use client";

import { createClient } from "@/lib/client";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-background w-full max-w-[400px] rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 min-h-[380px] flex flex-col justify-between">
        {/* Tombol Tutup (X) */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-text-main transition-colors"
          aria-label="Tutup modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header Modal */}
        <div className="mt-4">
          <h3 className="text-4xl font-bold text-text-main mb-4 font-sans tracking-tight leading-tight">
            Masuk/Daftar Akun
          </h3>
          <div className="text-text-main/80 text-[17px] font-sans leading-relaxed">
            <p>Masuk ke Maqlupastina</p>
            <p>Simpan riwayat pesanan dan nikmati</p>
            <p>proses checkout yang lebih cepat.</p>
          </div>
        </div>

        {/* Tombol Login Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-primary text-white font-bold py-3.5 px-4 rounded-xl hover:opacity-90 transition-opacity shadow-md font-sans text-lg mt-10"
        >
          <div className="bg-white rounded-full p-1 flex items-center justify-center w-8 h-8">
            <Image
              src="/google-logo.svg" // Pastikan path ini benar di folder public/
              alt="Google Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          Masuk/Daftar
        </button>
      </div>
    </div>
  );
}
