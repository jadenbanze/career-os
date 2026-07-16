import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { VisionItem } from "@/db/schema";
import { VisionDialog } from "@/features/vision/vision-dialog";
import {
  resolveImageSrc,
  useDeleteVisionItem,
  useReorderVisionItems,
  useVisionItems,
} from "@/features/vision/use-vision";

function SortableCard({
  item,
  onEdit,
}: {
  item: VisionItem;
  onEdit: (item: VisionItem) => void;
}) {
  const del = useDeleteVisionItem();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden py-0">
      {item.imagePath ? (
        <div className="bg-muted aspect-video w-full overflow-hidden">
          <img
            src={resolveImageSrc(item.imagePath)}
            alt=""
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
              {...listeners}
              {...attributes}
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </button>
            <h3 className="truncate font-medium">{item.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(item)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={async () => {
                  await del.mutateAsync(item.id);
                  toast.success("Card deleted");
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {item.category ? <Badge variant="secondary">{item.category}</Badge> : null}
        {item.note ? (
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {item.note}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export default function VisionBoardPage() {
  const { data, isLoading } = useVisionItems();
  const reorder = useReorderVisionItems();
  const [items, setItems] = useState<VisionItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VisionItem | null>(null);

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorder.mutate(next.map((i) => i.id));
  };

  return (
    <Page>
      <PageHeader
        title="Vision Board"
        description="Picture where you're headed — drag to arrange."
        icon={Sparkles}
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Add card
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Your vision board is empty"
          description="Add cards for the things you're working toward — roles, skills, a lifestyle."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              Add card
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  onEdit={(it) => {
                    setEditing(it);
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <VisionDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} />
    </Page>
  );
}
