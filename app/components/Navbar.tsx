"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CartIcon from "./CartIcon";
import AuthModal from "./AuthModal";
import { createClient } from "@/lib/client";

export default function Navbar({ user, profile }: { user: any; profile: any }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // State untuk menu dropdown
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fungsi Log Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    router.refresh(); // Segarkan halaman server
  };

  // Gunakan avatar dari Google, atau warna solid statis jika tidak ada
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full flex justify-between items-center z-50 px-6 py-4 lg:px-40 lg:py-[10px] transition-all duration-300 ${
          isScrolled
            ? "bg-background backdrop-blur-md shadow-md"
            : "bg-transparent"
        }`}
      >
        <Link
          href="/"
          className={`text-4xl font-abhaya font-extrabold tracking-wide hover:opacity-80 transition-colors duration-300 ${
            isScrolled ? "text-primary" : "text-background"
          }`}
          style={{ WebkitTextStroke: "0.5px var(--color-accent)" }}
        >
          Maqlupastina
        </Link>

        <div className="flex gap-4 items-center relative">
          <button className="w-11 h-11 bg-white border border-text-main/50 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <CartIcon className="w-5 h-5 text-primary" />
          </button>

          {/* Kondisional: Tampilkan Profil atau Tombol Masuk */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md hover:opacity-80 transition focus:outline-none"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-500"></div>
                )}
              </button>

              {/* DROPDOWN MENU PROFIL */}
              {isProfileMenuOpen && (
                <div className="absolute top-14 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex flex-col items-center z-50">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-500"></div>
                    )}
                  </div>
                  <h4 className="font-bold text-text-main text-lg">
                    {profile?.nick_name ||
                      user?.user_metadata?.full_name ||
                      "Pelanggan"}
                  </h4>
                  <p className="text-sm text-text-main/60 mb-5">{user.email}</p>

                  <div className="w-full flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-lg mb-3">
                    {/* SVG Ikon WhatsApp */}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    <span className="text-sm font-medium text-text-main">
                      {profile?.phone || "Belum ada nomor"}
                    </span>
                  </div>

                  <button className="w-full py-2 mb-2 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition text-sm">
                    Edit Identitas
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 border border-red-500 text-red-500 font-bold rounded-lg hover:bg-red-50 transition text-sm"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-text-main/50 text-text-main font-bold rounded-full hover:bg-gray-100 transition-colors shadow-sm text-sm"
            >
              Masuk/Daftar
            </button>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
