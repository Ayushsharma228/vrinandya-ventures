import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = "Vrinandya Ventures <onboarding@vrinandyaventures.in>";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "connect@vrinandyaventures.in";
