import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

const Input = z.object({
  name: z.string().trim().max(60).optional().default(""),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  message: z.string().trim().min(10).max(1000),
  lang: z.enum(["hi", "en"]).default("hi"),
  website: z.string().optional().default(""), // honeypot
  elapsed: z.number().optional().default(0),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`fb:${ip}`, 3, 10 * 60_000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const f = parsed.data;
  // Spam guard: bots fill the hidden field or submit instantly. Pretend success so they don't retry.
  if (f.website || f.elapsed < 2500) return NextResponse.json({ ok: true });
  try {
    await db.feedback.create({ data: { name: f.name, rating: f.rating ?? null, message: f.message, lang: f.lang } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback] save failed", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
