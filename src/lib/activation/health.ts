interface SellerSnap {
  name?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  bankAccount?: string | null;
}

interface ChecklistFlags {
  kycApproved: boolean;
  shopifyConnected: boolean;
  productsImported: boolean;
  firstListingLive: boolean;
  firstOrderReceived: boolean;
  walletActive: boolean;
  bankFilled: boolean;
  agreementSigned: boolean;
}

export function computeHealthScore(
  seller: SellerSnap,
  flags: ChecklistFlags,
  liveListingCount: number,
  hasOrder: boolean,
): { score: number; label: string } {
  let score = 0;

  // Profile completeness — 15 pts (3 each)
  if (seller.name)            score += 3;
  if (seller.phone)           score += 3;
  if (seller.gstNumber)       score += 3;
  if (seller.businessName)    score += 3;
  if (seller.businessAddress) score += 3;

  // Bank details — 5 pts
  if (flags.bankFilled) score += 5;

  // Agreement — 5 pts
  if (flags.agreementSigned) score += 5;

  // KYC — 20 pts
  if (flags.kycApproved) score += 20;

  // Store connected — 15 pts
  if (flags.shopifyConnected) score += 15;

  // Products / listings — 10 pts
  if (flags.productsImported) score += 5;
  if (flags.firstListingLive) score += 5;

  // Orders — 10 pts
  if (hasOrder) score += 10;

  // Wallet — 5 pts
  if (flags.walletActive) score += 5;

  // Live listings bonus (up to 10 extra pts)
  if (liveListingCount >= 5)      score += 10;
  else if (liveListingCount >= 2) score += 5;
  else if (liveListingCount >= 1) score += 2;

  score = Math.min(100, score);

  const label =
    score >= 80 ? "Excellent" :
    score >= 60 ? "Good" :
    score >= 40 ? "Needs Attention" : "Critical";

  return { score, label };
}

export function healthColor(label: string): string {
  if (label === "Excellent")      return "var(--green-500)";
  if (label === "Good")           return "#60A5FA";
  if (label === "Needs Attention") return "#F59E0B";
  return "#EF4444";
}
