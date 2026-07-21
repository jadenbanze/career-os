import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { desc } from "drizzle-orm";
import { format } from "date-fns";

import { db } from "@/db/client";
import {
  bragEntries,
  careerGoals,
  feedback,
  oneOnOnes,
  promotionMilestones,
  tasks,
  timelineEvents,
} from "@/db/schema";
import { parseTags } from "@/features/brag/use-brag";

function fmt(d: Date | null | undefined): string {
  return d ? format(new Date(d), "MMM d, yyyy") : "";
}

/** Builds a Markdown promo packet from brag entries, milestones, and goals. */
export async function buildPromoMarkdown(): Promise<string> {
  const [brag, milestones, goals] = await Promise.all([
    db.select().from(bragEntries).orderBy(desc(bragEntries.date)),
    db.select().from(promotionMilestones),
    db.select().from(careerGoals),
  ]);

  const lines: string[] = [];
  lines.push(`# Promotion Packet`);
  lines.push(`_Generated ${format(new Date(), "MMMM d, yyyy")}_`, "");

  lines.push(`## Accomplishments`, "");
  if (brag.length === 0) lines.push("_No entries yet._", "");
  for (const b of brag) {
    lines.push(`### ${b.title}`);
    const meta = [fmt(b.date), parseTags(b.tags).join(", ")].filter(Boolean).join(" · ");
    if (meta) lines.push(`_${meta}_`, "");
    if (b.impact) lines.push(`**Impact:** ${b.impact}`, "");
    if (b.description) lines.push(b.description, "");
  }

  lines.push(`## Promotion Milestones`, "");
  if (milestones.length === 0) lines.push("_No milestones yet._", "");
  for (const m of milestones) {
    const box = m.status === "complete" ? "x" : " ";
    const level = m.targetLevel ? ` (${m.targetLevel})` : "";
    const due = m.dueDate ? ` — target ${fmt(m.dueDate)}` : "";
    lines.push(`- [${box}] ${m.title}${level}${due}`);
    if (m.notes) lines.push(`  - ${m.notes}`);
  }
  lines.push("");

  lines.push(`## Development Goals`, "");
  if (goals.length === 0) lines.push("_No goals yet._", "");
  for (const g of goals) {
    const cat = g.category ? `${g.category} · ` : "";
    lines.push(`- **${g.title}** — ${cat}${g.progress}% (${g.status})`);
    if (g.notes) lines.push(`  - ${g.notes}`);
  }
  lines.push("");

  return lines.join("\n");
}

/** Serializes all user-authored data to a JSON backup object. */
export async function buildBackup(): Promise<Record<string, unknown>> {
  const [tasksRows, brag, milestones, goals, events, fb, oo] =
    await Promise.all([
      db.select().from(tasks),
      db.select().from(bragEntries),
      db.select().from(promotionMilestones),
      db.select().from(careerGoals),
      db.select().from(timelineEvents),
      db.select().from(feedback),
      db.select().from(oneOnOnes),
    ]);
  return {
    exportedAt: new Date().toISOString(),
    version: 3,
    tasks: tasksRows,
    bragEntries: brag,
    promotionMilestones: milestones,
    careerGoals: goals,
    timelineEvents: events,
    feedback: fb,
    oneOnOnes: oo,
  };
}

/** Prompts for a location and writes text; returns false if cancelled. */
async function saveText(
  defaultName: string,
  ext: string,
  extName: string,
  content: string,
): Promise<boolean> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: extName, extensions: [ext] }],
  });
  if (!path) return false;
  await writeTextFile(path, content);
  return true;
}

export async function savePromoPacket(): Promise<boolean> {
  return saveText("promo-packet.md", "md", "Markdown", await buildPromoMarkdown());
}

export async function saveBackup(): Promise<boolean> {
  const stamp = format(new Date(), "yyyy-MM-dd");
  return saveText(
    `career-os-backup-${stamp}.json`,
    "json",
    "JSON",
    JSON.stringify(await buildBackup(), null, 2),
  );
}
