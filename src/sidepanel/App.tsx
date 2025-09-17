import { useMemo } from "react";
import { Loader2Icon, SparklesIcon } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useElements } from "~/hooks/useElements";
import type { Element } from "~/types";

function App() {
  const { elements, orderedIds, templates, loading, error, total, hasMore, refreshTemplates } =
    useElements();

  const orderedElements = useMemo(
    () =>
      orderedIds
        .map((id) => elements[id])
        .filter((element): element is Element => Boolean(element)),
    [elements, orderedIds],
  );

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-b p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Prompt Studio</h1>
            <p className="text-muted-foreground text-sm">
              Phase 1 complete — unified Element model, builder stores, and database migration are ready.
            </p>
          </div>
          <Badge variant="secondary" className="uppercase tracking-wide">
            Phase 1
          </Badge>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4">
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SparklesIcon className="size-4" />
                Builder Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Templates are cached for quick access. Refresh after editing elements to keep the list up to date.
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void refreshTemplates();
                }}
                disabled={loading}
              >
                Refresh templates
              </Button>
              <Separator />
              <ScrollArea className="h-[260px] pr-2">
                <div className="space-y-3">
                  {templates.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      아직 템플릿이 없습니다. 새로운 템플릿 Element를 추가해보세요.
                    </p>
                  )}
                  {templates.map((template) => (
                    <div key={template.id} className="space-y-1 rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{template.title}</span>
                        <Badge variant="outline">{template.trigger}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{template.description ?? template.content}</p>
                      {template.requiredSlots && template.requiredSlots.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {template.requiredSlots.map((slot) => (
                            <Badge key={slot.id} variant={slot.required ? "default" : "secondary"}>
                              {slot.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Element Inventory</CardTitle>
            </CardHeader>
            <CardContent className="flex h-full flex-col">
              {loading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  데이터를 불러오는 중입니다...
                </div>
              ) : error ? (
                <div className="flex flex-1 items-center justify-center text-sm text-destructive">
                  {error}
                </div>
              ) : (
                <Tabs defaultValue="all" className="flex h-full flex-col">
                  <TabsList>
                    <TabsTrigger value="all">전체 ({total})</TabsTrigger>
                    <TabsTrigger value="templates">템플릿 ({templates.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="flex-1">
                    <InventoryList elements={orderedElements} hasMore={hasMore} />
                  </TabsContent>
                  <TabsContent value="templates" className="flex-1">
                    <InventoryList elements={templates} hasMore={false} />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

interface InventoryListProps {
  elements: Element[];
  hasMore: boolean;
}

function InventoryList({ elements, hasMore }: InventoryListProps) {
  if (elements.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        등록된 Element가 아직 없습니다.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[420px] pr-3">
      <div className="space-y-3">
        {elements.map((element) => (
          <div key={element.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{element.type}</Badge>
                <span className="text-sm font-medium">{element.title}</span>
              </div>
              <Badge variant="secondary">{element.trigger}</Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-2 line-clamp-3">{element.description ?? element.content}</p>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="pt-3 text-center text-xs text-muted-foreground">
          추가 Element가 더 있습니다. 검색 조건을 조정해보세요.
        </div>
      )}
    </ScrollArea>
  );
}

export default App;
