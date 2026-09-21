"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

// Helper untuk membuat kode unik
function generateOrderCode(type: "pickup" | "sapayu") {
  const prefix = type === "pickup" ? "#MQLP" : "#MQLD";
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit angka acak
  return `${prefix}-${randomNum}`;
}

export async function createOrder(payload: {
  portionCount: number;
  orderType: "pickup" | "sapayu";
  paymentMethod: "qris" | "cash";
  notes?: string;
  deliveryAddress?: string;
}) {
  const supabase = await createClient();

  // 1. Cek apakah kustomer sudah login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Silakan login terlebih dahulu");

  // 2. Ambil data Batch yang sedang BUKA
  const { data: activeBatch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("status", "OPEN")
    .single();

  if (batchError || !activeBatch)
    throw new Error("Maaf, Pre-Order saat ini sedang ditutup");

  // 3. Validasi sisa kuota
  if (activeBatch.remaining_quota < payload.portionCount) {
    throw new Error(
      `Sisa kuota tidak mencukupi. Tersisa ${activeBatch.remaining_quota} porsi.`,
    );
  }

  // 4. Kalkulasi & Persiapan Data
  const totalPrice = payload.portionCount * 10000;
  const orderCode = generateOrderCode(payload.orderType);

  // 5. Insert Pesanan ke Supabase
  const { error: insertError } = await supabase.from("orders").insert({
    order_code: orderCode,
    user_id: user.id,
    batch_id: activeBatch.id,
    portion_count: payload.portionCount,
    total_price: totalPrice,
    order_type: payload.orderType,
    payment_method: payload.paymentMethod,
    payment_status: "unpaid",
    order_status: "diproses",
    delivery_address: payload.deliveryAddress,
    notes: payload.notes,
  });

  if (insertError)
    throw new Error("Gagal membuat pesanan: " + insertError.message);

  // 6. Integrasi Midtrans (Khusus jika pilih QRIS)
  let snapToken = null;

  if (payload.paymentMethod === "qris") {
    // Encode Server Key Midtrans menjadi Base64
    const authString = Buffer.from(
      `${process.env.MIDTRANS_SERVER_KEY}:`,
    ).toString("base64");

    // Endpoint Sandbox Midtrans (Ganti ke Production nanti jika rilis)
    const midtransUrl = "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const midtransRes = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderCode,
          gross_amount: totalPrice,
        },
        enabled_payments: ["other_qris", "gopay", "shopeepay"], // Fokuskan ke QRIS
      }),
    });

    const midtransData = await midtransRes.json();

    if (!midtransRes.ok) {
      throw new Error(
        "Gagal memanggil Midtrans: " + midtransData.error_messages,
      );
    }

    snapToken = midtransData.token;
  }

  // 7. Bersihkan cache Next.js agar kuota di Landing Page langsung berkurang
  revalidatePath("/");

  return {
    success: true,
    orderCode: orderCode,
    snapToken: snapToken,
  };
}
