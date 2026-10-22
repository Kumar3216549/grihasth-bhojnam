import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { demoPayments, verifyCheckoutSignature } from "@/lib/razorpay";

const Body = z.object({
  token: z.string().min(5),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  demo: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const b = parsed.data;
  const order = await db.order.findUnique({ where: { publicToken: b.token } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (b.demo) {
    if (!demoPayments()) return NextResponse.json({ error: "Demo payments disabled" }, { status: 403 });
    await markPaid(order.id, "demo_" + Date.now());
    return NextResponse.json({ ok: true });
  }

  if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature) return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
  if (order.razorpayOrderId !== b.razorpay_order_id || !verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }
  await markPaid(order.id, b.razorpay_payment_id);
  return NextResponse.json({ ok: true });
}
