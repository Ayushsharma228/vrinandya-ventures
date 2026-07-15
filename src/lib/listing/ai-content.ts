// AI Listing Executive — Architecture Only
// LLM integration is NOT wired yet. This file defines the interface and
// serivce surface so future AI can be dropped in without touching callers.

import { AiContentRequest, AiContentSuggestion } from "./types";

export interface AiProvider {
  generateTitle(req: AiContentRequest): Promise<string>;
  generateBullets(req: AiContentRequest): Promise<string[]>;
  generateDescription(req: AiContentRequest): Promise<string>;
  generateKeywords(req: AiContentRequest): Promise<string[]>;
  generateSearchTerms(req: AiContentRequest): Promise<string[]>;
  scoreContent(content: AiContentSuggestion): Promise<number>;
}

// Null provider — returns empty suggestions until an AI provider is wired in
class NullAiProvider implements AiProvider {
  async generateTitle()       { return ""; }
  async generateBullets()     { return []; }
  async generateDescription() { return ""; }
  async generateKeywords()    { return []; }
  async generateSearchTerms() { return []; }
  async scoreContent()        { return 0; }
}

// Future: replace with ClaudeProvider or OpenAiProvider
const provider: AiProvider = new NullAiProvider();

export async function generateListingContent(req: AiContentRequest): Promise<AiContentSuggestion> {
  const [title, bullets, description, keywords, searchTerms] = await Promise.allSettled([
    provider.generateTitle(req),
    provider.generateBullets(req),
    provider.generateDescription(req),
    provider.generateKeywords(req),
    provider.generateSearchTerms(req),
  ]);

  return {
    title:       title.status       === "fulfilled" ? title.value       : undefined,
    bullets:     bullets.status     === "fulfilled" ? bullets.value     : undefined,
    description: description.status === "fulfilled" ? description.value : undefined,
    keywords:    keywords.status    === "fulfilled" ? keywords.value    : undefined,
    searchTerms: searchTerms.status === "fulfilled" ? searchTerms.value : undefined,
    source:      "ai",
  };
}

// Hook point — call this once an AI provider is ready
export function registerAiProvider(p: AiProvider) {
  Object.assign(provider, p);
}

// Readiness check — UI can show "AI Ready" or "AI Pending"
export function isAiReady(): boolean {
  return !(provider instanceof NullAiProvider);
}
