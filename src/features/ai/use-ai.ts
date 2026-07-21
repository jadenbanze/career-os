import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

import { getSetting, setSetting } from "@/features/settings/use-settings";

export const AI_ENABLED_KEY = "ai_enabled";
export const AI_ENDPOINT_KEY = "ai_endpoint";
export const AI_MODEL_KEY = "ai_model";

export const DEFAULT_AI_ENDPOINT = "http://localhost:11434";
export const DEFAULT_AI_MODEL = "llama3.1";

export const INBOX_CATEGORIES = [
  "win",
  "task",
  "event",
  "goal",
  "feedback",
  "milestone",
] as const;
export type InboxCategory = (typeof INBOX_CATEGORIES)[number];

export type AiSuggestion = {
  category: InboxCategory;
  title: string;
  details: string;
  size: string | null;
  tags: string[];
};

export type AiConfig = { enabled: boolean; endpoint: string; model: string };

export function useAiConfig() {
  return useQuery<AiConfig>({
    queryKey: ["settings", "ai"],
    queryFn: async () => {
      const [enabled, endpoint, model] = await Promise.all([
        getSetting(AI_ENABLED_KEY),
        getSetting(AI_ENDPOINT_KEY),
        getSetting(AI_MODEL_KEY),
      ]);
      return {
        enabled: enabled !== "false", // default on
        endpoint: endpoint || DEFAULT_AI_ENDPOINT,
        model: model || DEFAULT_AI_MODEL,
      };
    },
  });
}

export function useSaveAiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: AiConfig) => {
      await setSetting(AI_ENABLED_KEY, cfg.enabled ? "true" : "false");
      await setSetting(AI_ENDPOINT_KEY, cfg.endpoint.trim() || DEFAULT_AI_ENDPOINT);
      await setSetting(AI_MODEL_KEY, cfg.model.trim() || DEFAULT_AI_MODEL);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "ai"] }),
  });
}

export async function isAiEnabled(): Promise<boolean> {
  return (await getSetting(AI_ENABLED_KEY)) !== "false";
}

/** Categorize + enrich a note with the local model. Throws on failure. */
export async function categorizeWithAi(text: string): Promise<AiSuggestion> {
  const endpoint = (await getSetting(AI_ENDPOINT_KEY)) || DEFAULT_AI_ENDPOINT;
  const model = (await getSetting(AI_MODEL_KEY)) || DEFAULT_AI_MODEL;
  const raw = await invoke<Record<string, unknown>>("ai_categorize", {
    text,
    model,
    endpoint,
  });
  return normalize(raw, text);
}

function normalize(raw: Record<string, unknown>, text: string): AiSuggestion {
  const category = INBOX_CATEGORIES.includes(raw?.category as InboxCategory)
    ? (raw.category as InboxCategory)
    : "win";
  const title =
    typeof raw?.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : text.trim().slice(0, 80);
  const details = typeof raw?.details === "string" ? raw.details.trim() : "";
  const size = ["small", "medium", "large"].includes(raw?.size as string)
    ? (raw.size as string)
    : null;
  const tags = Array.isArray(raw?.tags)
    ? (raw.tags as unknown[]).map(String).slice(0, 6)
    : [];
  return { category, title, details, size, tags };
}

/** Zero-dependency fallback used when AI is disabled or unreachable. */
export function heuristicCategorize(text: string): AiSuggestion {
  const t = text.toLowerCase();
  let category: InboxCategory = "win";
  if (/\b(todo|need to|should|must|follow[ -]?up|fix|email|call|schedule|remember to)\b/.test(t)) {
    category = "task";
  } else if (/\b(feedback|praised?|kudos|thanked|shout ?out|recognition|nice job)\b/.test(t)) {
    category = "feedback";
  } else if (/\b(goal|learn|study|certif|improve|get better at|read)\b/.test(t)) {
    category = "goal";
  } else if (/\b(meeting|1:1|one[ -]on[ -]one|conference|event|trip|lunch|dinner|offsite)\b/.test(t)) {
    category = "event";
  }
  return { category, title: text.trim().slice(0, 80), details: "", size: null, tags: [] };
}
