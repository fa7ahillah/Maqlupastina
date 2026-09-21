"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import ProfileModal from "./ProfileModal";
import AuthModal from "./AuthModal"; // 1. Impor AuthModal

export default function OrderTeaser({ user }: { user: any }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // 2. State untuk modal login
  const supabase = createClient();

  const batchDate = "Rabu, 16 Sep 2026";
  const totalPortions = 30;
  const remainingPortions = 15;
  const price = "Rp10.000";
  const progressPercentage = (remainingPortions / totalPortions) * 100;

  const handleProceedToOrder = async () => {
    // 3. Jika belum login, langsung buka AuthModal alih-alih alert
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Cek kelengkapan data profil di tabel users
    const { data, error } = await supabase
      .from("users")
      .select("nick_name, phone")
      .eq("id", user.id)
      .single();

    if (error || !data?.nick_name || !data?.phone) {
      setIsProfileModalOpen(true);
    } else {
      alert(
        `Siap memproses pesanan untuk ${data.nick_name}! Menuju form checkout...`,
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between">
      <div>
        <h3 className="text-3xl font-sans font-extrabold text-text-main mb-3 leading-tight">
          Sudah.. Pesan saja.
        </h3>

        <div className="inline-block bg-background text-primary px-3 py-1.5 rounded-full text-xs font-sans font-bold mb-4 w-fit shadow-sm">
          Pre-Order Batch {batchDate}
        </div>

        <p className="text-text-main/80 text-sm mb-4 leading-relaxed font-sans font-medium">
          Hanya tersedia {totalPortions} porsi! Pesan sebelum kehabisan.
        </p>

        <p className="text-xl font-sans font-extrabold text-text-main mb-6">
          Hanya {price}!
        </p>

        <div className="mb-6">
          <div className="flex justify-between text-xs font-sans font-bold text-text-main mb-2">
            <span>Porsi yang tersisa</span>
            <span>
              {remainingPortions}/{totalPortions}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <button
        onClick={handleProceedToOrder}
        className="w-full bg-primary text-white font-sans font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm mt-auto"
      >
        {user ? "Pre-Order" : "Masuk untuk Pesan"}
      </button>

      {/* Modal Profile untuk pengguna yang sudah login */}
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          userId={user.id}
          userEmail={user.email}
          onSuccess={() => {
            setIsProfileModalOpen(false);
            alert("Data berhasil disimpan! Menuju ke pemesanan...");
          }}
        />
      )}

      {/* 4. Modal Auth untuk pengguna yang belum login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
