import Navbar from "@/app/components/Navbar";
import OrderTeaser from "@/app/components/OrderTeaser";
import Footer from "@/app/components/Footer";
import { createClient } from "@/lib/server";

export default async function Home() {
  const supabase = await createClient();

  // 1. Ambil data sesi autentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Ambil seluruh data profil (termasuk role, nick_name, phone) jika user sedang login
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*") // PERBAIKAN: Ambil seluruh kolom termasuk 'role'
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <main className="min-h-screen relative bg-background">
      {/* 3. Kirimkan data user dan profile ke Navbar */}
      <Navbar user={user} profile={profile} />

      {/* Hero Section & Floating Card */}
      <section
        className="relative w-full h-[450px] lg:h-[420px] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      >
        {/* FLOATING CARD CONTAINER */}
        <div className="absolute top-28 left-6 md:left-12 lg:left-40 z-10">
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-2xl w-[calc(100vw-3rem)] md:w-[420px] min-h-[300px]">
            <OrderTeaser user={user} />
          </div>
        </div>
      </section>

      {/* Section Edukasi */}
      <section className="px-6 md:px-12 lg:px-40 pt-36 pb-12 bg-background">
        <div className="w-full border-t border-text-main/15 mb-10"></div>

        <h2 className="text-3xl font-bold mb-4 text-text-main font-sans">
          Apa itu Makanan Maqlupastina?
        </h2>
        <p className="text-text-main/80 leading-relaxed max-w-2xl font-sans">
          Nikmati Maqluba autentik yang kini hadir dalam kemasan porsi personal,
          pas untuk melengkapi rutinitas harian Anda. Hidangan ini memadukan
          lapisan nasi aromatik, sayuran gurih, dan daging empuk kaya
          rempah—dikemas secara praktis dan higienis untuk menyajikan pengalaman
          kuliner yang lezat, terjangkau, dan menggugah selera.
        </p>
      </section>

      {/* FOOTER SECTION */}
      <Footer />
    </main>
  );
}
