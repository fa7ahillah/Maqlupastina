"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import Navbar from "@/app/components/Navbar";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(
    "Memulai verifikasi admin...",
  );
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"proses" | "selesai">("proses");
  const [isBatchOpen, setIsBatchOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalBatchPortions = 30;

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const initAdmin = async () => {
      try {
        setStatusMessage("Mengecek sesi login pengguna...");
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setStatusMessage("Sesi login tidak ditemukan.");
          return;
        }

        setUser(user);

        // Ambil Profil
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || profileData?.role !== "admin") {
          setStatusMessage("Akses Ditolak: Bukan Admin.");
          return;
        }

        setProfile(profileData);

        // Muat Seluruh Pesanan
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!ordersError && ordersData) {
          setOrders(ordersData);
        }
        setLoading(false);

        // REALTIME BULLETPROOF: Topik unik mencegah konflik cache channel di React Strict Mode
        const uniqueChannelTopic = `admin-orders-${Math.random().toString(36).substring(2, 9)}`;

        channel = supabase
          .channel(uniqueChannelTopic)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setOrders((prev) => [payload.new, ...prev]);
              } else if (payload.eventType === "UPDATE") {
                setOrders((prev) =>
                  prev.map((o) => (o.id === payload.new.id ? payload.new : o)),
                );
              }
            },
          )
          .subscribe();
      } catch (err: any) {
        console.error("Error in initAdmin:", err);
      }
    };

    initAdmin();

    // Pembersihan resmi saat komponen unmount / re-render
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router, supabase]);

  // Kalkulasi statistik batch & omzet
  const totalOrderedPortions = orders.reduce(
    (sum, o) => sum + (o.quantity || 0),
    0,
  );
  const remainingPortions = Math.max(
    0,
    totalBatchPortions - totalOrderedPortions,
  );
  const progressPercentage =
    ((totalBatchPortions - remainingPortions) / totalBatchPortions) * 100;

  const totalOmzet = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const qrisOmzet = orders
    .filter((o) => o.payment_method === "qris")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);
  const tunaiOmzet = orders
    .filter((o) => o.payment_method === "tunai")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  // Filter daftar pesanan sesuai tab aktif
  const inProgressOrders = orders.filter((o) => o.status !== "selesai");
  const completedOrders = orders.filter((o) => o.status === "selesai");
  const displayedOrders =
    activeTab === "proses" ? inProgressOrders : completedOrders;

  // Helper Format Sub-status Teks
  const getSubStatusText = (status: string, isPickup: boolean) => {
    const prefix = isPickup ? "Pick Up" : "SaPaYu";
    if (status === "pending") return `${prefix} • Menunggu diproses`;
    if (status === "diproses") return `${prefix} • Sedang diproses`;
    if (status === "siap_diambil") return `${prefix} • Siap diambil`;
    if (status === "diantar") return `${prefix} • Sedang diantar`;
    if (status === "selesai") return `${prefix} • Selesai`;
    return `${prefix} • ${status}`;
  };

  // Fungsi tandai pesanan selesai
  const handleCompleteOrder = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "selesai" })
        .eq("id", orderId);

      if (error) {
        alert(`Gagal memperbarui status: ${error.message}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Fungsi Export CSV Data Transaksi
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert("Tidak ada data pesanan untuk diexport.");
      return;
    }

    const headers = [
      "ID Pesanan",
      "Nama Pemesan",
      "Nomor WhatsApp",
      "Metode Order",
      "Jumlah Porsi",
      "Total Harga",
      "Metode Bayar",
      "Status",
      "Waktu Transaksi",
    ];

    const rows = orders.map((o) => [
      o.id,
      `"${o.recipient_name || ""}"`,
      `"${o.phone || ""}"`,
      o.order_method,
      o.quantity,
      o.total_price,
      o.payment_method,
      o.status,
      `"${new Date(o.created_at).toLocaleString("id-ID")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Data_Pesanan_Maqlupastina_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tampilan Layar Diagnostik Saat Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg max-w-md w-full space-y-4 font-sans">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-text-main font-sans">
            Verifikasi Akses Admin Dapur
          </h2>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-left font-sans">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-main/50 block mb-1 font-sans">
              Status Diagnostik:
            </span>
            <p className="text-xs font-mono font-bold text-text-main break-words font-sans">
              {statusMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-28 pt-24">
      <Navbar user={user} profile={profile} alwaysSolid={true} />

      <main className="max-w-6xl mx-auto px-6 pt-6 font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          {/* KOLOM KIRI (4 COLS): STATUS BATCH & OMZET */}
          <div className="lg:col-span-4 flex flex-col gap-6 font-sans">
            {/* KARTU 1: Status Batch */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 font-sans flex flex-col justify-between">
              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-center font-sans">
                  <h2 className="text-2xl font-bold text-text-main font-sans">
                    Status Batch
                  </h2>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 font-sans ${
                      isBatchOpen
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <span>{isBatchOpen ? "✔" : "✖"}</span>
                    {isBatchOpen ? "BUKA" : "TUTUP"}
                  </span>
                </div>

                <div className="font-sans">
                  <span className="text-xs text-text-main/60 block font-sans">
                    Jadwal PO:
                  </span>
                  <p className="text-sm font-bold text-text-main font-sans">
                    Rabu, 16 September 2026
                  </p>
                </div>

                {/* Indikator Kuota Porsi */}
                <div className="font-sans">
                  <div className="flex justify-between text-xs font-bold text-text-main mb-1.5 font-sans">
                    <span className="text-text-main/60">
                      Porsi yang tersisa
                    </span>
                    <span>
                      {remainingPortions}/{totalBatchPortions}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden font-sans">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300 font-sans"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsBatchOpen(!isBatchOpen)}
                className={`w-full mt-6 py-2.5 rounded-xl border text-xs font-bold transition font-sans ${
                  isBatchOpen
                    ? "border-red-300 text-red-600 hover:bg-red-50"
                    : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {isBatchOpen ? "Tutup Batch" : "Buka Batch"}
              </button>
            </div>

            {/* KARTU 2: Total Omzet Batch Hari Ini */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 font-sans flex flex-col justify-between">
              <div className="space-y-4 font-sans">
                <h2 className="text-2xl font-bold text-text-main leading-tight font-sans">
                  Total Omzet Batch Hari Ini
                </h2>

                <div className="text-2xl font-extrabold text-emerald-700 font-sans">
                  Rp{totalOmzet.toLocaleString("id-ID")}
                </div>

                <div className="space-y-1.5 text-xs text-text-main/70 font-sans border-t border-gray-100 pt-3">
                  <div className="flex justify-between font-sans">
                    <span>QRIS:</span>
                    <span className="font-bold text-text-main font-sans">
                      Rp{qrisOmzet.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span>Tunai:</span>
                    <span className="font-bold text-text-main font-sans">
                      Rp{tunaiOmzet.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Indikator Kuota Ringkas */}
                <div className="font-sans pt-2">
                  <div className="flex justify-between text-xs font-bold text-text-main mb-1.5 font-sans">
                    <span className="text-text-main/60">
                      Porsi yang tersisa
                    </span>
                    <span>
                      {remainingPortions}/{totalBatchPortions}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden font-sans">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300 font-sans"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Export CSV */}
              <button
                onClick={handleExportCSV}
                className="w-full mt-6 py-2.5 rounded-xl border border-primary text-primary text-xs font-bold hover:bg-primary/5 transition font-sans"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* KOLOM KANAN (8 COLS): DAFTAR PESANAN AKTIF */}
          <div className="lg:col-span-8 font-sans">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 font-sans min-h-[500px] flex flex-col">
              {/* Header Kartu Kanan */}
              <h2 className="text-2xl font-bold text-text-main mb-4 font-sans text-center">
                Daftar Pesanan Aktif
              </h2>

              {/* Tab Navigasi (Dalam Proses vs Selesai) */}
              <div className="flex border-b border-gray-200 mb-6 font-sans">
                <button
                  onClick={() => setActiveTab("proses")}
                  className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition font-sans ${
                    activeTab === "proses"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-main/50 hover:text-text-main"
                  }`}
                >
                  Dalam Proses
                </button>
                <button
                  onClick={() => setActiveTab("selesai")}
                  className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition font-sans ${
                    activeTab === "selesai"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-main/50 hover:text-text-main"
                  }`}
                >
                  Selesai
                </button>
              </div>

              {/* Daftar Kartu Pesanan */}
              {displayedOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center font-sans">
                  <p className="text-sm text-text-main/50 font-sans">
                    Tidak ada pesanan di kategori ini.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 font-sans">
                  {displayedOrders.map((order) => {
                    const isPickup = order.order_method === "pickup";
                    const shortId = isPickup
                      ? `#MQLP-${order.id.slice(0, 5).toUpperCase()}`
                      : `#MQLD-${order.id.slice(0, 5).toUpperCase()}`;

                    const subStatusText = getSubStatusText(
                      order.status,
                      isPickup,
                    );

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition font-sans flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Detail Kiri */}
                        <div className="space-y-1 font-sans">
                          <div className="flex items-center gap-2 font-sans">
                            <span className="font-extrabold text-sm text-text-main font-sans">
                              {shortId}
                            </span>
                            <span className="text-text-main/40">•</span>
                            <span className="font-bold text-sm text-text-main font-sans">
                              {order.recipient_name}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-text-main/70 font-sans">
                            {order.quantity}x Maqluba
                          </p>

                          <p className="text-xs text-text-main/50 font-sans">
                            {subStatusText}
                          </p>
                        </div>

                        {/* Detail Tengah & Aksi Kanan */}
                        <div className="flex items-center justify-between md:justify-end gap-4 font-sans pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                          {/* Total Harga & Status Bayar */}
                          <div className="text-left md:text-right font-sans">
                            <div className="text-sm font-extrabold text-text-main font-sans">
                              Rp{order.total_price.toLocaleString("id-ID")}
                            </div>
                            <span className="text-[11px] text-text-main/60 block font-sans">
                              {order.payment_method === "qris"
                                ? "Lunas (QRIS)"
                                : "Belum Lunas (Tunai)"}
                            </span>
                          </div>

                          {/* Tombol Hubungi WhatsApp */}
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-primary hover:underline px-2 py-1 font-sans"
                          >
                            Hubungi
                          </a>

                          {/* Tombol Aksi Selesai */}
                          {order.status !== "selesai" && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              disabled={updatingId === order.id}
                              className="px-4 py-2 rounded-xl border border-primary text-primary text-xs font-bold hover:bg-primary/10 transition font-sans disabled:opacity-50"
                            >
                              {updatingId === order.id ? "..." : "Selesai"}
                            </button>
                          )}

                          {/* Detail Struk Navigasi */}
                          <button
                            onClick={() => router.push(`/order/${order.id}`)}
                            className="text-gray-400 hover:text-text-main font-sans text-sm font-bold pl-1"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
