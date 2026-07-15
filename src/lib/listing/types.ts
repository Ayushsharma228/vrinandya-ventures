export type ListingPlatform = "AMAZON" | "FLIPKART" | "MEESHO" | "SHOPIFY";

export interface ContentDraft {
  title?:          string;
  bullets?:        string[];
  description?:    string;
  specifications?: Record<string, string>;
  keywords?:       string[];
  searchTerms?:    string[];
  category?:       string;
  hsn?:            string;
  gstRate?:        number;
  brand?:          string;
  attributes?:     Record<string, unknown>;
  changeNote?:     string;
}

export interface ValidationResult {
  valid:    boolean;
  score:    number;        // 0-100
  errors:   ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  field:   string;
  message: string;
  code:    string;
}

export interface TemplateRequirement {
  field:       string;
  required:    boolean;
  maxLength?:  number;
  minLength?:  number;
  format?:     string;
  description: string;
}

export interface ImageRequirement {
  minCount:   number;
  maxCount:   number;
  minWidth:   number;
  minHeight:  number;
  formats:    string[];
  maxSizeMB:  number;
}

// AI Content hooks — architecture only, no LLM calls yet
export interface AiContentRequest {
  productName:   string;
  category?:     string;
  brand?:        string;
  specifications?: Record<string, string>;
  platform:      ListingPlatform;
  existingDraft?: ContentDraft;
}

export interface AiContentSuggestion {
  title?:       string;
  bullets?:     string[];
  description?: string;
  keywords?:    string[];
  searchTerms?: string[];
  seoScore?:    number;
  source:       "ai" | "manual" | "template";
}
