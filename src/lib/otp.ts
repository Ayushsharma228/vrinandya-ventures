import crypto from "crypto";

const SECRET = process.env.OTP_SECRET ?? "axiqen-otp-2025";

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(otp: string): string {
  return crypto.createHmac("sha256", SECRET).update(otp).digest("hex");
}

export function otpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

/** Normalise Indian phone numbers → "91XXXXXXXXXX" (no +) */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return "91" + digits;
  return digits;
}
