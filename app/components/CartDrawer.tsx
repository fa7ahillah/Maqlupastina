"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  // State untuk menampung item keranjang (sementara kosong karena belum ada pesanan)
  const [cartItems, setCartItems] = useState<any[]>([]);
  const router = useRouter();

  return (
    <div
      className={`fixed inset-0 z-50 font-sans transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Latar Belakang Gelap */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel Geser dari Kanan */}
      <div
        className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col font-sans transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 font-sans">
          <h3 className="text-xl font-extrabold text-text-main font-sans">
            Keranjang Pesanan
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-text-main hover:bg-gray-200 transition font-sans text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Konten Drawer (Kondisional: Kosong vs Ada Pesanan) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center font-sans text-center">
          {cartItems.length === 0 ? (
            /* TAMPILAN KETIKA BELUM ADA PESANAN */
            <div className="flex flex-col items-center justify-center py-12 font-sans">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 font-sans text-primary shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 fill-none stroke-current stroke-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h4 className="font-extrabold text-text-main text-lg mb-2 font-sans">
                Belum Ada Pesanan
              </h4>
              <p className="text-sm text-text-main/60 mb-6 max-w-xs font-sans leading-relaxed">
                Kamu belum membuat pesanan Pre-Order Maqlupastina. Yuk, amankan
                porsimu sekarang sebelum kehabisan!
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push("/checkout");
                }}
                className="px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg text-sm font-sans"
              >
                Mulai Memesan
              </button>
            </div>
          ) : (
            /* TAMPILAN JIKA ADA PESANAN (DIPERTAHANKAN UNTUK LOGIKA BERIKUTNYA) */
            <div className="w-full text-left font-sans">
              {/* Daftar item keranjang akan dirender di sini */}
            </div>
          )}
        </div>

        {/* Footer Ringkasan (Hanya muncul jika ada pesanan) */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 font-sans">
            <button
              onClick={() => {
                onClose();
                router.push("/checkout");
              }}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition shadow-lg text-sm font-sans"
            >
              Lanjut ke Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
