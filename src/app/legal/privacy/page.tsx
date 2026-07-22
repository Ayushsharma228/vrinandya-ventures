import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Vrinandya Ventures",
  description: "How Vrinandya Ventures collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: July 22, 2026</p>

        <section className="space-y-8 text-gray-700 text-sm leading-7">

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Who We Are</h2>
            <p>Vrinandya Ventures (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the platform at <strong>app.vrinandyaventures.in</strong> — a dropshipping SaaS platform that connects sellers, suppliers, and administrators. Our registered contact email is <a href="mailto:vrinandyaventures@gmail.com" className="text-blue-600 underline">vrinandyaventures@gmail.com</a>.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Name, email address, phone number, business details provided during signup.</li>
              <li><strong>Order data:</strong> Customer names, addresses, order values, product details synced from your Shopify store.</li>
              <li><strong>Payment data:</strong> Transaction records, remittance history, wallet balances. We do not store raw card numbers.</li>
              <li><strong>Advertising data:</strong> If you connect your Meta Ads account, we access your ad spend data via the Meta Marketing API using permissions you explicitly grant.</li>
              <li><strong>Usage data:</strong> Pages visited, actions taken, browser type, IP address for security and analytics.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To operate and improve the platform.</li>
              <li>To process orders, payments, and remittances.</li>
              <li>To display your advertising spend alongside business performance metrics.</li>
              <li>To send transactional emails and WhatsApp notifications related to orders.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Meta Ads Integration</h2>
            <p>If you choose to connect your Meta Ads account, we request the <strong>ads_read</strong> permission to retrieve your ad spend data. We use this data solely to display your advertising costs on your dashboard. We do not:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Create, edit, or delete any ads on your behalf.</li>
              <li>Share your Meta data with third parties.</li>
              <li>Use your ad data for any purpose other than showing it to you.</li>
            </ul>
            <p className="mt-2">You can disconnect your Meta account at any time from your dashboard settings. Upon disconnection, we delete your stored access token immediately.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Suppliers:</strong> Order and customer delivery details needed to fulfill shipments.</li>
              <li><strong>Payment processors:</strong> Razorpay for processing subscription payments.</li>
              <li><strong>Shipping providers:</strong> Delhivery, Shiprocket, and others for shipment creation.</li>
              <li><strong>Infrastructure providers:</strong> Vercel (hosting), PlanetScale/Supabase (database), as necessary to operate the service.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you close your account, we delete your personal data within 30 days, except where we are required to retain it for legal or financial compliance purposes.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Withdraw consent for Meta Ads integration at any time.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, email us at <a href="mailto:vrinandyaventures@gmail.com" className="text-blue-600 underline">vrinandyaventures@gmail.com</a>.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Cookies</h2>
            <p>We use essential cookies for authentication (session management). We use the Meta Pixel for tracking page views on our marketing website. You can disable cookies in your browser settings.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Security</h2>
            <p>We use industry-standard encryption (HTTPS/TLS) for all data in transit. Sensitive credentials such as API keys are encrypted at rest. We conduct regular security reviews.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you via email for material changes. Continued use of the platform after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Contact Us</h2>
            <p>For any privacy-related questions, contact us at:<br />
            <strong>Vrinandya Ventures</strong><br />
            Email: <a href="mailto:vrinandyaventures@gmail.com" className="text-blue-600 underline">vrinandyaventures@gmail.com</a><br />
            Website: <a href="https://vrinandyaventures.in" className="text-blue-600 underline">vrinandyaventures.in</a>
            </p>
          </div>

        </section>
      </div>
    </div>
  );
}
