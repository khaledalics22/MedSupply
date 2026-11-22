export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function matchesSearch(value: string | undefined, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return normalizeSearchText(value ?? '').includes(normalizedQuery);
}

export function matchesAnySearch(values: Array<string | undefined>, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalizeSearchText(value ?? '').includes(normalizedQuery));
}
