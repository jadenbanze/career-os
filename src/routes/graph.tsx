import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Network } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import {
  ENTITY_LABEL,
  ENTITY_ROUTE,
  useLinkables,
  useLinks,
  type EntityType,
} from "@/features/links/use-links";

const TYPE_COLOR: Record<EntityType, string> = {
  task: "#60a5fa",
  brag: "#f59e0b",
  goal: "#34d399",
  milestone: "#a78bfa",
  event: "#f472b6",
  feedback: "#22d3ee",
  oneonone: "#fb7185",
};

export default function GraphPage() {
  const { data: links = [] } = useLinks();
  const { data: linkables = [] } = useLinkables();
  const navigate = useNavigate();

  const { nodes, edges } = useMemo(() => {
    const byKey = new Map(linkables.map((l) => [`${l.type}:${l.id}`, l]));
    const keys = new Set<string>();
    for (const l of links) {
      keys.add(`${l.sourceType}:${l.sourceId}`);
      keys.add(`${l.targetType}:${l.targetId}`);
    }
    const list = [...keys];
    const cx = 400;
    const cy = 300;
    const R = Math.min(250, 70 + list.length * 10);
    const pos = new Map<string, { x: number; y: number }>();
    list.forEach((k, i) => {
      const a = (i / Math.max(1, list.length)) * Math.PI * 2 - Math.PI / 2;
      pos.set(k, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    });
    const nodes = list.map((k) => {
      const idx = k.indexOf(":");
      const type = k.slice(0, idx) as EntityType;
      const p = pos.get(k)!;
      return { key: k, type, title: byKey.get(k)?.title ?? "(deleted)", ...p };
    });
    const edges = links
      .map((l) => ({
        id: l.id,
        a: pos.get(`${l.sourceType}:${l.sourceId}`),
        b: pos.get(`${l.targetType}:${l.targetId}`),
      }))
      .filter((e): e is { id: string; a: { x: number; y: number }; b: { x: number; y: number } } =>
        Boolean(e.a && e.b),
      );
    return { nodes, edges };
  }, [links, linkables]);

  return (
    <Page>
      <PageHeader
        title="Graph"
        description="How your wins, goals, milestones, and work connect."
        icon={Network}
      />

      {nodes.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No connections yet"
          description="Open any task, win, goal, milestone, or event and use 'Link' to connect it to something. Your career graph will grow here."
        />
      ) : (
        <div className="bg-background/50 overflow-hidden rounded-xl border">
          <svg viewBox="0 0 800 600" className="h-[600px] w-full">
            {edges.map((e) => (
              <line
                key={e.id}
                x1={e.a.x}
                y1={e.a.y}
                x2={e.b.x}
                y2={e.b.y}
                className="stroke-border"
                strokeWidth={1}
              />
            ))}
            {nodes.map((n) => (
              <g
                key={n.key}
                className="cursor-pointer"
                onClick={() => navigate(ENTITY_ROUTE[n.type])}
              >
                <circle cx={n.x} cy={n.y} r={7} fill={TYPE_COLOR[n.type]} />
                <text
                  x={n.x}
                  y={n.y - 12}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 10 }}
                >
                  {n.title.length > 18 ? `${n.title.slice(0, 18)}…` : n.title}
                </text>
              </g>
            ))}
          </svg>
          <div className="flex flex-wrap gap-3 border-t p-3 text-xs">
            {(Object.keys(TYPE_COLOR) as EntityType[]).map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: TYPE_COLOR[t] }}
                />
                {ENTITY_LABEL[t]}
              </span>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
