import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // 1. Refresh session auth kustomer/admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Proteksi ketat rute /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Belum login -> kembalikan ke landing page
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // PERBAIKAN: Ambil role dari tabel 'users' (BUKAN 'profiles')
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // Jika bukan admin -> kembalikan ke landing page
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua route kecuali file statis (gambar, favicon, dll)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
