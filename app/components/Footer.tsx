import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-background px-6 md:px-12 lg:px-40 py-16 mt-20">
      {/* Garis pembatas proporsional dengan konten */}
      <div className="w-full border-t border-text-main/15 pt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        {/* Sisi Kiri: Branding (Huruf M & Logo Teks) */}
        <div className="flex flex-col gap-4">
          <span className="text-6xl font-abhaya font-extrabold text-text-main">
            M
          </span>
          <div className="text-2xl font-sans font-extrabold tracking-wide">
            <span
              className="text-warning"
              style={{ WebkitTextStroke: "0.5px var(--color-accent)" }}
            >
              MAQL
            </span>
            <span
              className="text-text-main"
              style={{ WebkitTextStroke: "0.5px var(--color-accent)" }}
            >
              UPAS
            </span>
            <span
              className="text-primary"
              style={{ WebkitTextStroke: "0.5px var(--color-accent)" }}
            >
              TINA
            </span>
          </div>
        </div>

        {/* Sisi Kanan: Kontak & Sosial Media */}
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20 text-text-main">
          {/* Hubungi Kami (WhatsApp) */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-sans font-medium text-text-main/70">
              Hubungi kami:
            </p>
            <a
              href="https://wa.me/6285337427302"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-base font-sans font-semibold hover:text-primary transition-colors"
            >
              <div className="w-7 h-7 relative flex items-center justify-center">
                <Image
                  src="/whatsapp-logo.svg"
                  alt="WhatsApp"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              +62-853-3742-7302
            </a>
          </div>

          {/* Kunjungi Kami (Instagram & TikTok) */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-sans font-medium text-text-main/70">
              Kunjungi kami:
            </p>
            <div className="flex flex-col gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/maqlupastina"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-base font-sans font-semibold hover:text-primary transition-colors"
              >
                <div className="w-7 h-7 relative flex items-center justify-center">
                  <Image
                    src="/instagram-logo.svg"
                    alt="Instagram"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                @maqlupastina
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com/@maqlupastina"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-base font-sans font-semibold hover:text-primary transition-colors"
              >
                <div className="w-7 h-7 relative flex items-center justify-center">
                  <Image
                    src="/tiktok-logo.svg"
                    alt="TikTok"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                @maqlupastina
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
