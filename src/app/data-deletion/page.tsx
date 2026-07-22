import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — Vrinandya Ventures",
  description: "Request deletion of your data from Vrinandya Ventures.",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Request</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: July 22, 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-7">

          <p>If you have connected your Facebook / Meta account to Vrinandya Ventures and would like us to delete your data, you can request deletion using the methods below.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">What data we hold from Meta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your Meta access token (used to fetch ad spend data)</li>
              <li>Your Meta Ad Account ID</li>
              <li>Ad spend records synced from your Meta account</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">How to request deletion</h2>
            <p><strong>Option 1 — From your dashboard (instant):</strong><br />
            Log in to <a href="https://app.vrinandyaventures.in" className="text-blue-600 underline">app.vrinandyaventures.in</a> → Settings → Connected Accounts → Disconnect Meta Ads. This immediately deletes your access token and stops all data syncing.
            </p>
            <p><strong>Option 2 — Email us:</strong><br />
            Send an email to <a href="mailto:vrinandyaventures@gmail.com" className="text-blue-600 underline">vrinandyaventures@gmail.com</a> with subject line <strong>&quot;Data Deletion Request&quot;</strong> and include your registered email address. We will process your request within 7 business days and confirm via email.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">What happens after deletion</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your Meta access token is permanently deleted from our systems.</li>
              <li>Ad spend data synced from your Meta account is removed.</li>
              <li>We will send you a confirmation email once deletion is complete.</li>
              <li>Deletion is irreversible — you would need to reconnect your Meta account to resume syncing.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400">
            For general account deletion or other data requests, see our <a href="/legal/privacy" className="text-blue-600 underline">Privacy Policy</a>.
          </p>

        </div>
      </div>
    </div>
  );
}
