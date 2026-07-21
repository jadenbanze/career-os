import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_AI_ENDPOINT,
  DEFAULT_AI_MODEL,
  useAiConfig,
  useSaveAiConfig,
} from "./use-ai";

export function AiSettingsCard() {
  const { data: config } = useAiConfig();
  const save = useSaveAiConfig();

  const [enabled, setEnabled] = useState(true);
  const [endpoint, setEndpoint] = useState(DEFAULT_AI_ENDPOINT);
  const [model, setModel] = useState(DEFAULT_AI_MODEL);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setEndpoint(config.endpoint);
      setModel(config.model);
    }
  }, [config]);

  const onSave = async () => {
    try {
      await save.mutateAsync({ enabled, endpoint, model });
      toast.success("AI settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" />
          AI categorization (local)
        </CardTitle>
        <CardDescription>
          Uses a local Ollama model to sort and enrich quick captures — free and
          private, nothing leaves your machine. Turn off to fall back to a simple
          keyword guess.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="ai-enabled">Enable AI categorization</Label>
            <p className="text-muted-foreground text-xs">
              Requires Ollama running locally.
            </p>
          </div>
          <Switch id="ai-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai-endpoint">Ollama endpoint</Label>
            <Input
              id="ai-endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder={DEFAULT_AI_ENDPOINT}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-model">Model</Label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={DEFAULT_AI_MODEL}
            />
          </div>
        </div>
        <Button onClick={onSave} disabled={save.isPending}>
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
