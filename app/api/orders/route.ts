import { NextResponse } from "next/server";
import { createOrder, notifyCustomer, OrderError, OrderInput } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Creates an order.
 * - COD pre-order: booked now, paid in cash at delivery.
 * - UPI prepaid: saved with paymentStatus PENDING. The customer pays to the owner's UPI ID / QR and enters the
 *   reference ID on the order page. Only an admin can mark it PAID after checking the bank / UPI app.
 * Errors return a `code` so the form can show the message in Hindi or English.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`order:${ip}`, 8)) return NextResponse.json({ code: "rate" }, { status: 429 });

  const parsed = OrderInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const input = parsed.data;

  try {
    const order = await createOrder(input);
    if (order.paymentMethod === "COD") await notifyCustomer(order.id);
    return NextResponse.json({ token: order.publicToken });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ code: e.code, error: e.message }, { status: 400 });
    console.error("[orders] create failed", e);
    return NextResponse.json({ code: "generic" }, { status: 500 });
  }
}
