"use client";

import { createClient } from "@/lib/client";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-background w-full max-w-[400px] rounded-3xl p-8 shadow-2xl relative transform transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } min-h-[380px] flex flex-col justify-between font-sans`}
      >
        {/* Header Modal */}
        <div className="mt-4 font-sans">
          <h3 className="text-4xl font-bold text-text-main mb-4 font-sans tracking-tight leading-tight">
            Masuk/Daftar Akun
          </h3>
          <div className="text-text-main/80 text-[17px] font-sans leading-relaxed">
            <p className="font-sans">Masuk ke Maqlupastina</p>
            <p className="font-sans">Simpan riwayat pesanan dan nikmati</p>
            <p className="font-sans">proses checkout yang lebih cepat.</p>
          </div>
        </div>

        {/* Container Tombol Aksi */}
        <div className="flex flex-col gap-2 mt-8 font-sans">
          {/* Tombol Login Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-primary text-white font-bold py-3.5 px-4 rounded-xl hover:opacity-90 transition-opacity shadow-md font-sans text-lg"
          >
            <div className="bg-white rounded-full p-1 flex items-center justify-center w-8 h-8">
              <Image
                src="/google-logo.svg"
                alt="Google Logo"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            Masuk/Daftar
          </button>

          {/* Tombol Batal */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-text-main/70 hover:text-text-main underline font-sans mt-2"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
