import type { LucideIcon } from "lucide-react";

import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function StubPage({
  title,
  description,
  icon,
  planned,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  planned: string[];
}) {
  return (
    <Page>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={<Badge variant="secondary">Coming soon</Badge>}
      />
      <Card>
        <CardContent className="py-6">
          <p className="mb-3 text-sm font-medium">Planned for this section</p>
          <ul className="space-y-2">
            {planned.map((item) => (
              <li
                key={item}
                className="text-muted-foreground flex items-start gap-2 text-sm"
              >
                <span className="bg-muted-foreground/40 mt-1.5 size-1.5 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Page>
  );
}
