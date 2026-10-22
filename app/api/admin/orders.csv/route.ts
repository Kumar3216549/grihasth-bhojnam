import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDayPlan } from "@/lib/kitchen";
import { dbDate, ymdIST } from "@/lib/dates";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date") || "") ? url.searchParams.get("date")! : ymdIST();
  const plan = await getDayPlan(dbDate(date));
  const rows = [
    ["Date", "Area", "Factory", "Address", "Shift", "Customer", "Phone", "Type", "Order No", "Veg", "Paneer", "Amount", "Payment", "Payment status", "Status"],
    ...plan.byCompany.flatMap((c) =>
      c.lines.map((l) => [date, l.areaName, l.companyName, l.address, l.shift, l.customerName, l.phone, l.source === "SUBSCRIPTION" ? "Monthly" : "Daily", l.orderNo ?? "", l.veg, l.paneer, l.amount ?? "", l.paymentMethod ?? "Prepaid", l.paymentStatus ?? "PAID", l.status ?? ""]),
    ),
  ];
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="grihasth-orders-${date}.csv"` } });
}
