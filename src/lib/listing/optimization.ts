// Computes an optimization score (0–100) for listing content quality

interface ContentForScore {
  title?:          string | null;
  bullets?:        string[];
  description?:    string | null;
  keywords?:       string[];
  searchTerms?:    string[];
  brand?:          string | null;
  category?:       string | null;
  hsn?:            string | null;
  gstRate?:        number | null;
  attributes?:     Record<string, unknown> | null;
  imageCount?:     number;
}

export function computeOptimizationScore(content: ContentForScore): number {
  let score = 0;
  const max  = 100;

  // Title (25 pts) — exists + optimal length 60–150 chars
  if (content.title) {
    score += 10;
    const len = content.title.length;
    if (len >= 60 && len <= 150) score += 15;
    else if (len >= 30)          score += 8;
  }

  // Bullet points (20 pts)
  const bullets = content.bullets ?? [];
  if (bullets.length >= 5)      score += 20;
  else if (bullets.length >= 3) score += 12;
  else if (bullets.length >= 1) score += 6;

  // Description (15 pts) — exists + optimal length 150–1000 chars
  if (content.description) {
    score += 5;
    const len = content.description.length;
    if (len >= 150) score += 10;
    else            score += 4;
  }

  // Keywords (10 pts)
  const kws = content.keywords ?? [];
  if (kws.length >= 10)      score += 10;
  else if (kws.length >= 5)  score += 6;
  else if (kws.length >= 1)  score += 3;

  // Search terms (5 pts)
  if ((content.searchTerms ?? []).length >= 1) score += 5;

  // Brand + category (10 pts)
  if (content.brand)    score += 5;
  if (content.category) score += 5;

  // Compliance — HSN + GST (10 pts)
  if (content.hsn)                              score += 5;
  if (content.gstRate !== null && content.gstRate !== undefined) score += 5;

  // Images (5 pts)
  const imgs = content.imageCount ?? 0;
  if (imgs >= 5)      score += 5;
  else if (imgs >= 3) score += 3;
  else if (imgs >= 1) score += 1;

  return Math.min(max, score);
}
