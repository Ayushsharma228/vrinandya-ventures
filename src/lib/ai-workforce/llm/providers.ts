import type { LLMProvider } from "./types";
import { ClaudeProvider, isClaudeAvailable } from "./claude";

const registry = new Map<string, LLMProvider>();
let defaultProviderName = "claude";

export function registerLLMProvider(name: string, provider: LLMProvider): void {
  registry.set(name, provider);
}

export function getLLMProvider(name?: string): LLMProvider {
  const key = name ?? defaultProviderName;
  const provider = registry.get(key);
  if (!provider) throw new Error(`LLM provider "${key}" is not registered`);
  return provider;
}

export function setDefaultProvider(name: string): void {
  defaultProviderName = name;
}

export function isLLMReady(name?: string): boolean {
  const key = name ?? defaultProviderName;
  if (key === "claude") return isClaudeAvailable();
  return registry.has(key);
}

// Register Claude on module load
registerLLMProvider("claude", new ClaudeProvider());
