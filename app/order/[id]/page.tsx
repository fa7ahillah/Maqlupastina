"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/client";
import Navbar from "@/app/components/Navbar";
import { toPng } from "html-to-image";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);

      // Ambil profil user untuk navbar
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Ambil detail pesanan awal
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !orderData) {
        console.error("Gagal memuat pesanan:", error);
        alert("Pesanan tidak ditemukan.");
        router.push("/");
        return;
      }

      setOrder(orderData);
      setLoading(false);
    };

    if (orderId) {
      fetchOrderDetails();

      // REALTIME LISTENER: Otomatis perbarui state jika status di database diubah oleh Admin Dapur
      const channel = supabase
        .channel(`order-status-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            console.log("Status pesanan terbarui live:", payload.new);
            setOrder(payload.new);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId, router, supabase]);

  // Fungsi untuk mengunduh struk sebagai gambar PNG
  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);

    try {
      const dataUrl = await toPng(receiptRef.current, {
        quality: 0.95,
        pixelRatio: 2, // Resolusi tinggi HD
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Struk_Maqlupastina_${shortId}.png`;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh struk:", err);
      alert("Gagal mengunduh struk digital. Silakan coba lagi.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <p className="text-text-main/70 font-sans font-medium">
          Memuat detail pesanan...
        </p>
      </div>
    );
  }

  const isPickup = order.order_method === "pickup";
  const foodTotal = order.quantity * 10000;
  const shippingFee = isPickup ? 0 : 5000;
  const shortId = order.id
    ? `#MQL-${order.id.slice(0, 5).toUpperCase()}`
    : "#MQL-00000";

  // Format Status Pembayaran
  const paymentStatusText =
    order.payment_method === "qris"
      ? "Lunas (QRIS)"
      : order.status === "pending"
        ? "Belum Lunas (Tunai)"
        : "Lunas (Tunai)";

  return (
    <div className="min-h-screen bg-background font-sans pb-28 pt-24">
      <Navbar user={user} profile={profile} alwaysSolid={true} />

      <main className="max-w-xl mx-auto px-6 pt-6 font-sans">
        {/* Tombol Navigasi & Aksi */}
        <div className="flex justify-between items-center mb-6 font-sans">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-text-main hover:bg-gray-50 transition font-sans shadow-sm"
          >
            ←
          </Link>

          {/* Tombol Unduh Struk (PNG) */}
          <button
            onClick={handleDownloadReceipt}
            disabled={downloading}
            className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition shadow-sm font-sans flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>📥</span>
            {downloading ? "Mengunduh..." : "Unduh Struk (PNG)"}
          </button>
        </div>

        {/* KARTU STRUK UTAMA (Hanya area ini yang akan ditangkap menjadi PNG) */}
        <div
          ref={receiptRef}
          id="receipt-card"
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 font-sans flex flex-col gap-6"
        >
          {/* Header Logo */}
          <div className="text-center border-b border-gray-100 pb-6 font-sans">
            <div className="w-10 h-10 mx-auto rounded-full bg-text-main text-white font-serif font-bold flex items-center justify-center text-lg mb-2 shadow-sm">
              M
            </div>
            <h1 className="text-xl font-extrabold tracking-widest text-text-main font-sans uppercase">
              MAQLUPASTINA
            </h1>
          </div>

          {/* Status Pesanan */}
          <div className="font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 mb-3 font-sans">
              Status Pesanan
            </h3>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans space-y-3">
              <div className="flex justify-between text-xs font-bold text-text-main font-sans">
                <span>ID Pesanan:</span>
                <span className="font-mono">{shortId}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-text-main font-sans">
                <span>Status:</span>
                <span className="text-primary">{paymentStatusText}</span>
              </div>

              {/* Progress Bar Langkah */}
              <div className="pt-3 font-sans">
                <div className="relative flex items-center justify-between font-sans">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-primary z-0 rounded-full" />

                  {/* Step 1 */}
                  <div className="relative z-10 flex flex-col items-center font-sans">
                    <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                    <span className="text-[11px] font-bold text-text-main mt-1 font-sans">
                      Diproses
                    </span>
                  </div>
                  {/* Step 2 */}
                  <div className="relative z-10 flex flex-col items-center font-sans">
                    <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                    <span className="text-[11px] font-bold text-text-main mt-1 font-sans">
                      {isPickup ? "Siap diambil" : "Diantar"}
                    </span>
                  </div>
                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center font-sans">
                    <div className="w-4 h-4 rounded-full bg-gray-300 ring-4 ring-white" />
                    <span className="text-[11px] font-bold text-text-main/50 mt-1 font-sans">
                      Selesai
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Pengambilan / Pengantaran */}
          <div className="font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 mb-3 font-sans">
              {isPickup ? "Pengambilan (Pick Up)" : "Pengantaran (SaPaYu)"}
            </h3>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans space-y-2.5 text-xs">
              <div className="flex justify-between font-sans">
                <span className="text-text-main/60">Pemesan:</span>
                <span className="font-bold text-text-main">
                  {order.recipient_name}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-text-main/60">No. Whatsapp:</span>
                <span className="font-bold text-text-main">{order.phone}</span>
              </div>
              <div className="flex justify-between items-start font-sans">
                <span className="text-text-main/60">
                  {isPickup ? "Outlet:" : "Alamat:"}
                </span>
                <span className="font-bold text-text-main text-right max-w-[200px]">
                  {isPickup
                    ? "Outlet Utama Maqlupastina (Jl. Pendidikan No. 15)"
                    : order.detail_address || order.google_maps_link}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-text-main/60">Jadwal:</span>
                <span className="font-bold text-text-main">
                  Minggu, 27 Sep 2026 (08.00 - 11.00 WITA)
                </span>
              </div>
            </div>
          </div>

          {/* Ringkasan Item & Pembayaran */}
          <div className="font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 mb-3 font-sans">
              Ringkasan Item & Pembayaran
            </h3>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans space-y-2.5 text-xs">
              <div className="flex justify-between font-sans">
                <span className="text-text-main">
                  {order.quantity}x Maqluba
                </span>
                <span className="font-bold text-text-main">
                  Rp {foodTotal.toLocaleString("id-ID")}
                </span>
              </div>
              {!isPickup && (
                <div className="flex justify-between font-sans">
                  <span className="text-text-main">Ongkos Kirim</span>
                  <span className="font-bold text-text-main">
                    Rp {shippingFee.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm font-extrabold text-text-main font-sans">
                <span>Total</span>
                <span>Rp {order.total_price.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ELEMEN INTERAKTIF DILUAR CATCHMENT AREA (TIDAK IKUT TERUNDUH DI PNG) */}
        <div className="mt-6 flex flex-col gap-4 font-sans">
          <p className="text-[11px] text-red-600 text-center font-semibold font-sans">
            Jika kustomer mengalami kendala mendesak, mereka cukup menekan
            menghubungi Dapur.
          </p>

          <a
            href="https://wa.me/628123456789?text=Halo%20Dapur%20Maqlupastina,%20saya%20ingin%20menanyakan%20pesanan%20saya."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white border border-primary text-primary hover:bg-primary/5 font-bold py-3.5 rounded-xl text-center text-sm transition font-sans shadow-sm"
          >
            Hubungi Dapur
          </a>
        </div>
      </main>
    </div>
  );
}
