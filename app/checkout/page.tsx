"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import Navbar from "@/app/components/Navbar";

// Load peta secara dinamis khusus sisi klien (mencegah error SSR Leaflet)
const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
});

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // State Formulir
  const [orderMethod, setOrderMethod] = useState<"pickup" | "sapayu">("pickup");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [addressInputType, setAddressInputType] = useState<
    "interactive" | "instant-gps"
  >("interactive");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // State untuk teks alamat GPS Otomatis
  const [gpsAddressText, setGpsAddressText] = useState<string>("");
  const [isLoadingGpsAddress, setIsLoadingGpsAddress] = useState(false);

  const [quantity, setQuantity] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "tunai">("qris");

  const pricePerPortion = 10000;
  const shippingFee = orderMethod === "sapayu" ? 5000 : 0;
  const foodTotal = quantity * pricePerPortion;
  const totalPayment = quantity > 0 ? foodTotal + shippingFee : 0;

  const [remainingPortions, setRemainingPortions] = useState(30);
  const totalPortions = 30;
  const progressPercentage =
    ((totalPortions - remainingPortions) / totalPortions) * 100;
  const isQuotaExceeded = quantity > remainingPortions;

  // Fungsi untuk mengambil teks alamat dari koordinat GPS Instan
  const fetchGpsAddressName = async (lat: number, lng: number) => {
    setIsLoadingGpsAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "MaqlupastinaPreOrderApp/1.0",
          },
        },
      );
      const data = await response.json();
      if (data && data.display_name) {
        setGpsAddressText(data.display_name);
      } else {
        setGpsAddressText(`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (error) {
      console.error("Gagal mengambil teks alamat GPS:", error);
      setGpsAddressText(`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsLoadingGpsAddress(false);
    }
  };

  // Fungsi untuk mengambil koordinat GPS instan
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak Mendukung Layanan Lokasi.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setGoogleMapsLink(mapUrl);
        setIsGettingLocation(false);
        fetchGpsAddressName(lat, lng);
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Gagal mendapatkan lokasi:", error);
        alert(
          "Gagal mendeteksi lokasi. Pastikan izin akses lokasi diaktifkan.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Otomatis ubah metode pembayaran ke QRIS jika beralih ke SaPaYu
  useEffect(() => {
    if (orderMethod === "sapayu") {
      setPaymentMethod("qris");
    }
  }, [orderMethod]);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      // Ambil profil pengguna
      const { data: profileData } = await supabase
        .from("users")
        .select("nick_name, phone")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        if (profileData.nick_name) setRecipientName(profileData.nick_name);
        if (profileData.phone) setPhone(profileData.phone);
      }

      // Hitung sisa kuota secara dinamis dari tabel orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("quantity");

      if (!ordersError && ordersData) {
        const totalOrdered = ordersData.reduce(
          (sum, order) => sum + (order.quantity || 0),
          0,
        );
        setRemainingPortions(Math.max(0, totalPortions - totalOrdered));
      }

      setLoading(false);
    };

    fetchCheckoutData();
  }, [router, supabase]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (quantity <= 0) {
      alert("Silakan pilih jumlah porsi minimal 1.");
      return;
    }

    if (isQuotaExceeded) {
      alert("Jumlah porsi melebihi sisa kuota yang tersedia.");
      return;
    }

    if (orderMethod === "sapayu" && !googleMapsLink) {
      alert(
        "Silakan tentukan titik lokasi pengantaran SaPaYu terlebih dahulu.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data: insertedOrder, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          recipient_name: recipientName,
          phone: phone,
          order_method: orderMethod,
          detail_address: orderMethod === "sapayu" ? detailAddress : null,
          google_maps_link: orderMethod === "sapayu" ? googleMapsLink : null,
          quantity: quantity,
          total_price: totalPayment,
          payment_method: paymentMethod,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        const errorDetails = JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        );
        console.error("Supabase Error Detail:", errorDetails);
        alert(
          `Gagal membuat pesanan (Database): ${error.message || errorDetails}`,
        );
        return;
      }

      alert("Pesanan berhasil dibuat! Menuju rincian pesanan.");
      router.push(`/order/${insertedOrder.id}`);
    } catch (err: any) {
      console.error("Unexpected Exception:", err);
      alert(`Terjadi kesalahan sistem: ${err.message || String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <p className="text-text-main/70 font-sans font-medium">
          Memuat data checkout...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-28 pt-24">
      <Navbar user={user} profile={profile} alwaysSolid={true} />

      <main className="max-w-6xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 font-sans">
        {/* Kolom Kiri: Ilustrasi & Teks Persuasif */}
        <div className="lg:col-span-5 flex flex-col font-sans">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-text-main hover:bg-gray-50 transition mb-6 font-sans shadow-sm"
          >
            ←
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-text-main leading-snug mb-4 font-sans">
            Pertimbangkan jumlah porsi yang Anda pesan..
          </h1>
          <p className="text-sm text-text-main/70 leading-relaxed mb-8 font-sans">
            Pastikan Anda sudah menawarkan teman, sahabat, saudara, orang tua,
            rekan kerja, atasan, bawahan, dan yang lainnya.
          </p>

          <div className="w-full flex justify-center items-center py-4 font-sans">
            <Image
              src="/makan-bang.png"
              alt="Ilustrasi Makan Maqlupastina"
              width={350}
              height={350}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Kolom Kanan: Kartu Formulir Buat Pesanan */}
        <div className="lg:col-span-7 font-sans">
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl border border-gray-100 font-sans">
            <h2 className="text-2xl font-extrabold text-text-main mb-6 font-sans">
              Buat Pesanan
            </h2>

            <form
              onSubmit={handleSubmitOrder}
              id="checkout-form"
              className="flex flex-col gap-6 font-sans"
            >
              {/* Metode Pemesanan */}
              <div className="font-sans">
                <label className="block text-xs font-bold text-text-main mb-2 uppercase tracking-wider font-sans">
                  Metode Pemesanan
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 font-sans">
                  <button
                    type="button"
                    onClick={() => setOrderMethod("pickup")}
                    className={`py-2.5 rounded-xl text-sm font-bold transition font-sans ${
                      orderMethod === "pickup"
                        ? "bg-primary text-white shadow-md"
                        : "text-text-main/70 hover:text-text-main"
                    }`}
                  >
                    Pick Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMethod("sapayu")}
                    className={`py-2.5 rounded-xl text-sm font-bold transition font-sans ${
                      orderMethod === "sapayu"
                        ? "bg-primary text-white shadow-md"
                        : "text-text-main/70 hover:text-text-main"
                    }`}
                  >
                    SaPaYu
                  </button>
                </div>

                {orderMethod === "pickup" ? (
                  <div className="text-xs text-text-main/70 mt-3 leading-relaxed font-sans space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <p className="text-xs text-text-main/60 mt-2 leading-relaxed font-sans">
                      Anda dapat mengambil pesanan di outlet kami.{" "}
                      <span className="text-red-600 block mt-1 font-semibold">
                        Pesanan yang sudah dibayar tidak dapat dibatalkan secara
                        mandiri.
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-text-main/70 mt-3 leading-relaxed font-sans space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <p className="font-bold text-text-main font-sans">
                      Sarapan Pagi Yummy: Pengantaran untuk memulai hari Minggu
                      Anda yang cerah.
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-text-main/70 font-sans">
                      <li>
                        Pengantaran hanya dilakukan di sekitar kota Mataram.
                      </li>
                      <li>
                        Pengantaran akan dilakukan pada Minggu, pukul 08:00
                        WITA.
                      </li>
                      <li>Batas pemesanan: Sabtu s/d pukul 20:00 WITA.</li>
                    </ul>
                    <p className="text-red-600 font-semibold pt-1 font-sans">
                      Pesanan yang sudah dibayar tidak dapat dibatalkan secara
                      mandiri.
                    </p>
                  </div>
                )}
              </div>

              {/* Alamat Pengambilan / Pengantaran */}
              <div className="font-sans">
                <label className="block text-xs font-bold text-text-main mb-2 uppercase tracking-wider font-sans">
                  {orderMethod === "pickup"
                    ? "Alamat Pengambilan"
                    : "Alamat Pengantaran"}
                </label>

                {orderMethod === "pickup" ? (
                  <div className="flex flex-col gap-3 font-sans">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50 font-sans shadow-sm">
                      <div className="flex items-start gap-3 font-sans">
                        <span className="text-red-500 mt-0.5">📍</span>
                        <div className="font-sans">
                          <h4 className="font-bold text-sm text-text-main font-sans">
                            Outlet Utama Mataram
                          </h4>
                          <p className="text-xs text-text-main/60 font-sans">
                            Jl. Pendidikan No. 15, Mataram
                          </p>
                        </div>
                      </div>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Jl.+Pendidikan+No.+15,+Mataram"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 text-primary font-bold px-3 py-2 rounded-xl hover:bg-primary/25 transition font-sans shadow-sm flex items-center gap-1.5"
                      >
                        <span>🗺️</span> Buka Maps
                      </a>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans text-xs text-text-main/70 space-y-1">
                      <p className="font-bold text-text-main font-sans">
                        Catatan Pengambilan:
                      </p>
                      <p className="font-sans">
                        Silakan tunjukkan halaman konfirmasi atau nomor pesanan
                        Anda kepada petugas di outlet saat mengambil makanan.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 font-sans">
                    {/* Tampilan Tombol Pill Modern */}
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressInputType("interactive");
                          setGoogleMapsLink("");
                          setGpsAddressText("");
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition font-sans flex items-center justify-center gap-1.5 ${
                          addressInputType === "interactive"
                            ? "bg-primary text-white shadow-md"
                            : "text-text-main/70 hover:text-text-main"
                        }`}
                      >
                        <span>🗺️</span> Peta Interaktif
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddressInputType("instant-gps");
                          setGoogleMapsLink("");
                          setGpsAddressText("");
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition font-sans flex items-center justify-center gap-1.5 ${
                          addressInputType === "instant-gps"
                            ? "bg-primary text-white shadow-md"
                            : "text-text-main/70 hover:text-text-main"
                        }`}
                      >
                        <span>📍</span> GPS Otomatis
                      </button>
                    </div>

                    {/* Render Berdasarkan Pilihan Tab */}
                    {addressInputType === "interactive" ? (
                      <MapPicker
                        onLocationSelect={(link, address) => {
                          setGoogleMapsLink(link);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col gap-3 font-sans bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <p className="text-xs text-text-main/70 font-sans leading-relaxed">
                          Gunakan titik koordinat perangkat Anda saat ini secara
                          instan tanpa harus membuka peta.
                        </p>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="w-full bg-primary hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition font-sans flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>📍</span>
                          {isGettingLocation
                            ? "Mendeteksi Lokasi..."
                            : googleMapsLink
                              ? "Perbarui Koordinat GPS"
                              : "Ambil Koordinat Sekarang"}
                        </button>

                        {/* Kotak Hasil Deteksi Alamat GPS Otomatis */}
                        {googleMapsLink && (
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200 font-sans mt-2 shadow-sm">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-text-main/60 block mb-1 font-sans">
                              Alamat Terdeteksi dari GPS:
                            </span>
                            <p className="text-xs font-semibold text-text-main font-sans">
                              {isLoadingGpsAddress
                                ? "Mencari nama jalan..."
                                : gpsAddressText ||
                                  "Koordinat GPS berhasil dikunci."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detail Alamat / Patokan */}
                    <div className="font-sans">
                      <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider font-sans">
                        Detail Alamat / Patokan (Opsional)
                      </label>
                      <textarea
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                        placeholder="Contoh: Pagar hitam, dekat pos satpam"
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-sans resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Nama Penerima & Nomor Telepon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider font-sans">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Contoh: Fatahillah"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider font-sans">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-sans"
                  />
                </div>
              </div>

              {/* Jumlah Porsi */}
              <div className="font-sans">
                <h3 className="text-lg font-extrabold text-text-main mb-2 font-sans">
                  Jumlah Porsi
                </h3>
                <div className="flex justify-between items-center mb-2 font-sans">
                  <span className="text-xs font-bold text-text-main/70 font-sans">
                    Porsi yang tersisa
                  </span>
                  <span className="text-xs font-bold text-text-main font-sans">
                    {remainingPortions}/{totalPortions}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-4 font-sans">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 font-sans"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-center gap-6 py-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center hover:opacity-90 transition font-sans text-lg shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-2xl font-extrabold text-text-main font-sans w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center hover:opacity-90 transition font-sans text-lg shadow-sm"
                  >
                    +
                  </button>
                </div>

                {isQuotaExceeded && (
                  <p className="text-xs text-red-500 text-center mt-2 font-semibold font-sans">
                    Kuotatidak cukup/Kuota habis.
                  </p>
                )}
              </div>

              {/* Metode Pembayaran */}
              <div className="font-sans">
                <label className="block text-xs font-bold text-text-main mb-2 uppercase tracking-wider font-sans">
                  Metode Pembayaran
                </label>
                <div className="flex flex-col gap-3 font-sans">
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition font-sans ${
                      paymentMethod === "qris"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="text-sm font-bold text-text-main font-sans">
                      QRIS
                    </span>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "qris"}
                      onChange={() => setPaymentMethod("qris")}
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    />
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border transition font-sans ${
                      orderMethod === "sapayu"
                        ? "opacity-50 bg-gray-100 border-gray-200 cursor-not-allowed"
                        : paymentMethod === "tunai"
                          ? "border-primary bg-primary/5 cursor-pointer"
                          : "border-gray-200 bg-white cursor-pointer"
                    }`}
                  >
                    <div className="font-sans">
                      <span className="text-sm font-bold text-text-main font-sans block">
                        Tunai
                      </span>
                      {orderMethod === "sapayu" && (
                        <span className="text-[11px] text-text-main/60 font-sans">
                          Tidak tersedia untuk metode pengantaran SaPaYu
                        </span>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      disabled={orderMethod === "sapayu"}
                      checked={paymentMethod === "tunai"}
                      onChange={() => setPaymentMethod("tunai")}
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar Total & Checkout */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-4 px-6 lg:px-40 flex justify-between items-center z-40 font-sans shadow-lg">
        <div className="font-sans">
          {orderMethod === "sapayu" && quantity > 0 && (
            <span className="text-xs text-text-main/60 block font-sans">
              Hanya Rp {foodTotal.toLocaleString("id-ID")} + Ongkir Rp 5.000!
            </span>
          )}
          <span className="text-xs text-text-main/60 block font-sans">
            Total Pembayaran
          </span>
          <span className="text-xl font-extrabold text-text-main font-sans">
            Rp {totalPayment.toLocaleString("id-ID")}
          </span>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={
            submitting ||
            quantity <= 0 ||
            isQuotaExceeded ||
            (orderMethod === "sapayu" && !googleMapsLink)
          }
          className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition shadow-lg text-sm disabled:opacity-50 font-sans"
        >
          {submitting ? "Memproses..." : "Lanjut ke Pembayaran"}
        </button>
      </div>
    </div>
  );
}
