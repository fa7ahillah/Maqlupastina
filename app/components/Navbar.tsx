"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import CartIcon from "./CartIcon";
import AuthModal from "./AuthModal";
import ProfileModal from "./ProfileModal";
import { createClient } from "@/lib/client";
import CartDrawer from "./CartDrawer";

export default function Navbar({
  user,
  profile,
  alwaysSolid = false,
}: {
  user: any;
  profile: any;
  alwaysSolid?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Kondisi Pengecekan Admin & Rute Aktif
  const isAdminPage = pathname?.startsWith("/admin");
  const isAdminUser = profile?.role === "admin";

  useEffect(() => {
    if (alwaysSolid) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysSolid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    router.refresh();
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const showBackground = alwaysSolid || isScrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full flex justify-between items-center z-50 px-6 py-4 lg:px-40 lg:py-[10px] transition-all duration-300 font-sans ${
          showBackground
            ? "bg-background backdrop-blur-md shadow-md"
            : "bg-transparent"
        }`}
      >
        {/* LOGO SISIAN KIRI */}
        <Link
          href="/"
          className={`text-4xl font-abhaya font-extrabold tracking-wide hover:opacity-80 transition-colors duration-300 font-sans flex items-center gap-2.5 ${
            showBackground ? "text-primary" : "text-background"
          }`}
          style={{ WebkitTextStroke: "0.5px var(--color-accent)" }}
        >
          {/* Ikon admin HANYA MUNCUL jika sedang di halaman /admin */}
          {isAdminPage && isAdminUser && (
            <img
              src="/admin-icon.svg"
              alt="Admin Icon"
              className="w-8 h-8 object-contain"
            />
          )}

          <span>Maqlupastina</span>

          {/* Badge Label Admin HANYA MUNCUL di halaman /admin */}
          {isAdminPage && isAdminUser && (
            <span className="text-[10px] bg-amber-500 text-white font-sans font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs border border-white/20">
              Admin
            </span>
          )}
        </Link>

        <div className="flex gap-4 items-center relative font-sans">
          {/* Tombol Keranjang (Hanya muncul jika bukan halaman /admin) */}
          {!isAdminPage && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md active:scale-95 shadow-sm font-sans"
              title="Lihat Keranjang"
            >
              <CartIcon className="w-5 h-5 text-primary" />
            </button>
          )}

          {user ? (
            <div className="relative font-sans" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md active:scale-95 shadow-md focus:outline-none font-sans ${
                  isAdminUser
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-white"
                }`}
                title="Menu Profil"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full ${
                      isAdminUser ? "bg-amber-500" : "bg-orange-500"
                    }`}
                  ></div>
                )}
              </button>

              {/* DROPDOWN MENU PROFIL */}
              <div
                className={`absolute top-14 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 flex flex-col items-center z-50 font-sans origin-top-right transition-all duration-200 transform ${
                  isProfileMenuOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {/* Avatar Lingkaran Besar */}
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-sm font-sans">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-500"></div>
                  )}
                </div>

                {/* Nama & Email */}
                <h3 className="font-extrabold text-text-main text-xl font-sans text-center">
                  {profile?.nick_name ||
                    profile?.full_name ||
                    user?.user_metadata?.full_name ||
                    "Fatahillah"}
                </h3>
                <p className="text-sm text-text-main/70 mb-5 font-sans text-center">
                  {user.email}
                </p>

                {/* Kotak Nomor WhatsApp */}
                <div className="w-full flex items-center gap-3.5 px-4 py-3 border border-gray-300 rounded-2xl mb-4 font-sans bg-white">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                  </div>
                  <span className="text-base font-semibold text-text-main font-sans">
                    {profile?.phone || "08123456789"}
                  </span>
                </div>

                {/* TOMBOL NAVIGASI UTAMA ADMIN */}
                {isAdminUser && (
                  <Link
                    href={isAdminPage ? "/" : "/admin"}
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full py-3 mb-3 bg-primary text-white text-center font-bold text-base rounded-2xl hover:bg-primary/90 transition font-sans shadow-sm"
                  >
                    {isAdminPage ? "Halaman Utama" : "Admin"}
                  </Link>
                )}

                {/* Tombol Edit Identitas */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full py-3 mb-3 border border-primary text-primary font-bold text-base rounded-2xl hover:bg-primary/5 transition font-sans"
                >
                  Edit Identitas
                </button>

                {/* Tombol Keluar */}
                <button
                  onClick={handleLogout}
                  className="w-full py-3 border border-red-500 text-red-600 font-bold text-base rounded-2xl hover:bg-red-50 transition font-sans"
                >
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-text-main/50 text-text-main font-bold rounded-full hover:bg-gray-100 transition-colors shadow-sm text-sm font-sans"
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

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          userId={user.id}
          userEmail={user.email}
          onSuccess={() => {
            setIsProfileModalOpen(false);
            router.refresh();
          }}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
