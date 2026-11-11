/** Normalise Indian mobile numbers to +91XXXXXXXXXX; keep other international numbers as +digits. */
export function normalizePhone(raw: string) {
  const d = raw.replace(/[^\d+]/g, "");
  const digits = d.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return "+91" + digits;
  if (/^0[6-9]\d{9}$/.test(digits)) return "+91" + digits.slice(1);
  if (/^91[6-9]\d{9}$/.test(digits)) return "+" + digits;
  return d.startsWith("+") ? "+" + digits : "+" + digits;
}
export const waNumber = (phone: string) => phone.replace(/\D/g, "");
