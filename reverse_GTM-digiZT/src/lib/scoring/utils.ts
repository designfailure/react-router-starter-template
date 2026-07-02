export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countKeywordMatches(keywords: string[], text: string): number {
  if (keywords.length === 0 || text.length === 0) {
    return 0;
  }

  const normalizedText = normalizeText(text);
  const matches = new Set<string>();

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword.length > 0 && normalizedText.includes(normalizedKeyword)) {
      matches.add(normalizedKeyword);
    }
  }

  return matches.size;
}

export function keywordOverlapScore(keywords: string[], text: string): number {
  if (keywords.length === 0) {
    return 0;
  }

  return clamp(countKeywordMatches(keywords, text) / keywords.length, 0, 1);
}

export function hasAnyKeyword(keywords: string[], text: string): boolean {
  return countKeywordMatches(keywords, text) > 0;
}

export function firstSentence(text: string): string {
  const normalized = text.trim();
  const index = normalized.search(/[.!?]/);
  return index >= 0 ? normalized.slice(0, index + 1) : normalized;
}

export function wordCount(text: string): number {
  const normalized = normalizeText(text);
  if (!normalized) {
    return 0;
  }
  return normalized.split(" ").filter(Boolean).length;
}
