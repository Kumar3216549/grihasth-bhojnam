import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay Dashboard → Settings → Webhooks → URL: https://YOUR-DOMAIN/api/razorpay/webhook
// Events: payment.captured, order.paid. Secret = RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const evt = JSON.parse(raw);
  const payment = evt?.payload?.payment?.entity;
  const rOrderId: string | undefined = payment?.order_id ?? evt?.payload?.order?.entity?.id;
  if ((evt.event === "payment.captured" || evt.event === "order.paid") && rOrderId) {
    const order = await db.order.findUnique({ where: { razorpayOrderId: rOrderId } });
    if (order) await markPaid(order.id, payment?.id ?? null);
  }
  if (evt.event === "payment.failed" && rOrderId) {
    await db.order.updateMany({ where: { razorpayOrderId: rOrderId, paymentStatus: "PENDING" }, data: { paymentStatus: "FAILED" } });
  }
  return NextResponse.json({ ok: true });
}
