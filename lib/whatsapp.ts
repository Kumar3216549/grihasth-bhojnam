/**
 * WhatsApp auto-messages through the official WhatsApp Business Cloud API (Meta).
 * - Set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID to enable.
 * - Business-initiated messages need an APPROVED TEMPLATE (WHATSAPP_TEMPLATE_NAME).
 *   Suggested template body (Hindi/Hinglish, 4 variables):
 *   "Namaste {{1}}, aapka tiffin {{2}} par {{3}} me pahuch jayega. Order no. {{4}}. – Grihasth Bhojnam"
 * - Without a template we send a plain text message, which Meta only delivers inside a 24-hour chat window.
 * Never throws: an order must not fail because WhatsApp failed.
 */
export type WaResult = { ok: boolean; skipped?: boolean; error?: string };

export function toWaNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? "91" + d : d;
}

export function shiftTime(shift: string) {
  return shift.match(/\d{1,2}:\d{2}\s?[AP]M/i)?.[0] ?? shift;
}

export function orderMessage(o: { customerName: string; shift: string; companyName: string; orderNo: string }, invoiceUrl?: string) {
  let m = `Namaste ${o.customerName}, aapka tiffin ${shiftTime(o.shift)} par ${o.companyName} me pahuch jayega. 🙏\nOrder no. ${o.orderNo}`;
  if (invoiceUrl) m += `\nBill / Invoice: ${invoiceUrl}`;
  m += `\n– Grihasth Bhojnam by Sachin\nव्यापार नहीं, व्यवहार परोसते हैं हम।`;
  return m;
}

export async function sendWhatsApp(
  to: string,
  text: string,
  templateParams?: string[],
): Promise<WaResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.info("[whatsapp] not configured — message skipped:\n" + text);
    return { ok: false, skipped: true };
  }
  const template = process.env.WHATSAPP_TEMPLATE_NAME;
  const body = template && templateParams
    ? {
        messaging_product: "whatsapp",
        to: toWaNumber(to),
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "hi" },
          components: [{ type: "body", parameters: templateParams.map((p) => ({ type: "text", text: p })) }],
        },
      }
    : { messaging_product: "whatsapp", to: toWaNumber(to), type: "text", text: { body: text, preview_url: true } };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[whatsapp] send failed", res.status, err);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (e) {
    console.error("[whatsapp] send error", e);
    return { ok: false, error: String(e) };
  }
}
