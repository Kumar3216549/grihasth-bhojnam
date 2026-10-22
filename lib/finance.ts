import { db } from "./db";
import { costPerTiffin, tiffinsInRange } from "./kitchen";
import { ymd } from "./dates";

/** Cash-basis P&L for a date range (dates are @db.Date values, inclusive). */
export async function getPnL(start: Date, end: Date, withDaily = true) {
  const [paidOrders, expenses, cost] = await Promise.all([
    db.order.findMany({ where: { paymentStatus: "PAID", deliveryDate: { gte: start, lte: end } }, select: { amount: true, deliveryDate: true, planType: true } }),
    db.expense.findMany({ where: { date: { gte: start, lte: end } }, orderBy: { date: "desc" } }),
    costPerTiffin(),
  ]);
  const revenue = paidOrders.reduce((a, o) => a + o.amount, 0);
  const revenueDaily = paidOrders.filter((o) => o.planType === "DAILY").reduce((a, o) => a + o.amount, 0);
  const revenueMonthly = revenue - revenueDaily;
  const expenseTotal = expenses.reduce((a, e) => a + e.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;

  let days: { date: string; revenue: number; expense: number; tiffins: number }[] = [];
  let tiffins = 0;
  let foodCostEstimate = 0;
  if (withDaily) {
    const served = await tiffinsInRange(start, end);
    tiffins = served.reduce((a, d) => a + d.veg + d.paneer, 0);
    foodCostEstimate = served.reduce((a, d) => a + d.veg * cost.veg + d.paneer * cost.paneer, 0);
    days = served.map((d) => {
      const k = ymd(d.date);
      return {
        date: k,
        tiffins: d.veg + d.paneer,
        revenue: paidOrders.filter((o) => ymd(o.deliveryDate) === k).reduce((a, o) => a + o.amount, 0),
        expense: expenses.filter((e) => ymd(e.date) === k).reduce((a, e) => a + e.amount, 0),
      };
    });
  }
  const profit = revenue - expenseTotal;
  return {
    revenue, revenueDaily, revenueMonthly, expenseTotal, profit, byCategory, expenses, days, tiffins, foodCostEstimate,
    costPerTiffin: cost,
    revenuePerTiffin: tiffins ? revenue / tiffins : 0,
    margin: revenue ? (profit / revenue) * 100 : 0,
  };
}
