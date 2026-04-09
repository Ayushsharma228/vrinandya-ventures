"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Lock, Eye, EyeOff } from "lucide-react";

type Zone = "seller" | "supplier" | null;

function LoginContent() {
  const searchParams = useSearchParams();
  const defaultZone = searchParams.get("zone") as Zone;

  const [zone, setZone] = useState<Zone>(defaultZone);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: identifier,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username/email or password");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();

    if (session?.user?.role === "ADMIN") {
      window.location.href = "/admin";
    } else if (session?.user?.role === "SUPPLIER") {
      window.location.href = "/supplier";
    } else if (session?.user?.role === "SELLER") {
      if (!session?.user?.plan) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/seller";
      }
    }
  }

  // ── Landing page — zone not selected ──────────────────────────────────────
  if (!zone) {
    return (
      <div
        className="min-h-screen w-full flex flex-col"
        style={{
          background: "linear-gradient(135deg, #e8eaf6 0%, #f0f4ff 40%, #e8f5e9 100%)",
          backgroundImage: `
            linear-gradient(135deg, #e8eaf6 0%, #f0f4ff 40%, #e8f5e9 100%),
            linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      >
        {/* Navbar */}
        <nav className="flex items-center px-10 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#40916c" }}>
              <span className="text-white text-xs font-bold">VV</span>
            </div>
            <span className="font-bold text-gray-800 text-lg">Vrinandya Ventures</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center" style={{ marginTop: "-2rem" }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white/80 text-sm text-gray-600 mb-6 shadow-sm">
            <span>🚀</span>
            <span>The Future of E-commerce</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-2">
            The Engine for
          </h1>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-5" style={{ color: "#40916c" }}>
            Modern Commerce
          </h1>

          <p className="text-gray-500 text-lg max-w-xl mb-12">
            From product sourcing to order confirmation. Let AI automate your entire
            e-commerce journey while you focus on scaling.
          </p>

          {/* Two Zone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            {/* Seller Card */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-left flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-xs font-semibold tracking-widest text-blue-500 uppercase">Seller Zone</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Seller Dashboard</h3>
              <p className="text-blue-600 text-sm mb-4 border-l-2 border-blue-400 pl-3">
                Manage your Shopify store, browse approved products, and streamline your e-commerce operations.
              </p>
              <ul className="text-sm text-gray-500 space-y-1.5 mb-6 flex-1">
                {["Browse approved supplier products", "Push products to your Shopify store", "Manage orders and analytics", "Track product performance"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setZone("seller")}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: "#3b5bdb" }}
              >
                Access Seller Dashboard →
              </button>
            </div>

            {/* Supplier Card */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-left flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold tracking-widest text-green-600 uppercase">Supplier Zone</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supplier Dashboard</h3>
              <p className="text-green-600 text-sm mb-4 border-l-2 border-green-400 pl-3">
                List your products, manage inventory, and reach more sellers through our platform.
              </p>
              <ul className="text-sm text-gray-500 space-y-1.5 mb-6 flex-1">
                {["Submit products for approval", "Manage your product catalog", "Track approval status", "Upload product images"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setZone("supplier")}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: "#40916c" }}
              >
                Access Supplier Dashboard →
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center py-6 text-sm text-gray-400 space-y-1">
          <p>© 2025 Vrinandya Ventures. All rights reserved.</p>
          <p>
            Admin?{" "}
            <a href="/admin/login" className="text-purple-500 hover:underline">
              Admin Login
            </a>
          </p>
        </footer>
      </div>
    );
  }

  // ── Login Form — zone selected ─────────────────────────────────────────────
  const isSeller = zone === "seller";
  const accentColor = isSeller ? "#3b5bdb" : "#40916c";
  const zoneLabel = isSeller ? "Seller Zone" : "Supplier Zone";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #e8eaf6 0%, #f0f4ff 40%, #e8f5e9 100%)",
        backgroundImage: `
          linear-gradient(135deg, #e8eaf6 0%, #f0f4ff 40%, #e8f5e9 100%),
          linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full" style={{ maxWidth: 420 }}>
        {/* Zone badge + Back */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
              {zoneLabel}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Welcome Back</h2>
            <p className="text-gray-400 text-sm mt-0.5">Enter your credentials to access your dashboard</p>
          </div>
          <button onClick={() => setZone(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
            ← Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username or Email */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: accentColor }}>
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter username or email"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold" style={{ color: accentColor }}>
                Password
              </label>
              <button type="button" className="text-xs text-gray-400 hover:text-gray-600">
                Forgot your password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: accentColor }}
          >
            {loading ? "Signing in..." : `Sign In to ${zoneLabel}`}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Need supplier access?{" "}
            <button onClick={() => setZone("supplier")} className="text-green-600 hover:underline font-medium">
              Supplier Login
            </button>
          </p>
          <p className="text-xs text-gray-400">
            Admin access?{" "}
            <Link href="/admin/login" className="text-purple-600 hover:underline font-medium">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 to-green-50" />}>
      <LoginContent />
    </Suspense>
  );
}
