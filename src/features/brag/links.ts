export type BragLinkType = "task" | "jira" | "milestone";

export type BragLink = {
  type: BragLinkType;
  id: string;
  label: string;
};

export function parseLinks(value: string | null | undefined): BragLink[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is BragLink =>
        l && typeof l.id === "string" && typeof l.type === "string",
    );
  } catch {
    return [];
  }
}

export function serializeLinks(links: BragLink[]): string | null {
  return links.length ? JSON.stringify(links) : null;
}
