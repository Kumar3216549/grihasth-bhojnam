import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createOrder, notifyCustomer, OrderError, OrderInput } from "@/lib/orders";
import { demoPayments, razorpayEnabled, rzp } from "@/lib/razorpay";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`order:${ip}`, 8)) return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });

  const parsed = OrderInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const input = parsed.data;

  if (input.paymentMethod === "ONLINE" && !razorpayEnabled() && !demoPayments()) {
    return NextResponse.json({ error: "Online payment is not set up yet. Please choose cash on delivery or WhatsApp us." }, { status: 503 });
  }

  try {
    const order = await createOrder(input);

    if (input.paymentMethod === "COD") {
      await notifyCustomer(order.id);
      return NextResponse.json({ token: order.publicToken });
    }

    if (demoPayments()) {
      return NextResponse.json({ token: order.publicToken, demo: true, amount: order.amount });
    }

    const rOrder = await rzp().orders.create({
      amount: order.amount * 100,
      currency: "INR",
      receipt: order.orderNo,
      notes: { orderNo: order.orderNo, company: order.companyName, plan: order.planType },
    });
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rOrder.id } });

    return NextResponse.json({
      token: order.publicToken,
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: rOrder.id,
        amount: order.amount * 100,
        name: "Grihasth Bhojnam",
        description: `${order.planType === "MONTHLY" ? "Monthly" : "Daily"} tiffin × ${order.qty} — ${order.orderNo}`,
        prefill: { name: order.customerName, contact: "+91" + order.phone },
      },
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[orders] create failed", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
