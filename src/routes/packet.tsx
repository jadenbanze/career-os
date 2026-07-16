import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { parseTags, useBragEntries } from "@/features/brag/use-brag";
import { useCareerGoals } from "@/features/career/use-career";
import { savePromoPacket } from "@/features/export/export";
import { usePromotionMilestones } from "@/features/promotion/use-promotion";

function fmt(d: Date | null | undefined): string {
  return d ? format(new Date(d), "MMM d, yyyy") : "";
}

export default function PacketPage() {
  const navigate = useNavigate();
  const { data: brag } = useBragEntries();
  const { data: milestones } = usePromotionMilestones();
  const { data: goals } = useCareerGoals();

  const exportMd = async () => {
    try {
      if (await savePromoPacket()) toast.success("Saved Markdown");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-8 flex items-center gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportMd}>
              <Download className="size-4" />
              Export .md
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        <article className="space-y-10">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Promotion Packet</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Generated {format(new Date(), "MMMM d, yyyy")}
            </p>
          </header>

          <section>
            <h2 className="mb-4 border-b pb-1 text-xl font-semibold">
              Accomplishments
            </h2>
            {!brag || brag.length === 0 ? (
              <p className="text-muted-foreground text-sm">No entries yet.</p>
            ) : (
              <div className="space-y-5">
                {brag.map((b) => (
                  <div key={b.id}>
                    <h3 className="font-medium">{b.title}</h3>
                    <p className="text-muted-foreground text-xs">
                      {[fmt(b.date), parseTags(b.tags).join(", ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {b.impact ? (
                      <p className="mt-1 text-sm">
                        <span className="font-medium">Impact: </span>
                        {b.impact}
                      </p>
                    ) : null}
                    {b.description ? (
                      <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                        {b.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 border-b pb-1 text-xl font-semibold">
              Promotion Milestones
            </h2>
            {!milestones || milestones.length === 0 ? (
              <p className="text-muted-foreground text-sm">No milestones yet.</p>
            ) : (
              <ul className="space-y-2">
                {milestones.map((m) => (
                  <li key={m.id} className="text-sm">
                    <span className="mr-2">
                      {m.status === "complete" ? "☑" : "☐"}
                    </span>
                    <span className="font-medium">{m.title}</span>
                    {m.targetLevel ? ` (${m.targetLevel})` : ""}
                    {m.dueDate ? ` — target ${fmt(m.dueDate)}` : ""}
                    {m.notes ? (
                      <div className="text-muted-foreground ml-6">{m.notes}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-4 border-b pb-1 text-xl font-semibold">
              Development Goals
            </h2>
            {!goals || goals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No goals yet.</p>
            ) : (
              <ul className="space-y-2">
                {goals.map((g) => (
                  <li key={g.id} className="text-sm">
                    <span className="font-medium">{g.title}</span>
                    {g.category ? ` — ${g.category}` : ""} · {g.progress}% ({g.status})
                    {g.notes ? (
                      <div className="text-muted-foreground ml-4">{g.notes}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}
