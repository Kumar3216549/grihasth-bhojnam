import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

const Input = z.object({ ref: z.string().trim().regex(/^[A-Za-z0-9]{6,30}$/) });

/**
 * Customer submits the UPI transaction / reference ID after paying.
 * This is NOT treated as proof of payment — it only helps the owner find the payment.
 * The order stays PENDING until an admin verifies it in /admin/orders.
 */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`upiref:${ip}`, 6)) return NextResponse.json({ code: "rate" }, { status: 429 });
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ code: "invalid" }, { status: 400 });

  const o = await db.order.findUnique({ where: { publicToken: params.token }, select: { id: true, paymentMethod: true, paymentStatus: true } });
  if (!o || o.paymentMethod !== "UPI") return NextResponse.json({ code: "notfound" }, { status: 404 });
  if (o.paymentStatus === "PAID") return NextResponse.json({ ok: true, paid: true });

  await db.order.update({ where: { id: o.id }, data: { upiRef: parsed.data.ref.toUpperCase(), upiRefAt: new Date() } });
  return NextResponse.json({ ok: true });
}
