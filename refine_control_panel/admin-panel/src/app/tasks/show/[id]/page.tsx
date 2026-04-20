"use client";

import { ShowView } from "@/components/refine-ui/views/show-view";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useShow } from "@refinedev/core";

export default function TaskShow() {
  const { result: record } = useShow({});

  return (
    <ShowView>
      <Card>
        <CardHeader>
          <CardTitle>{record?.title}</CardTitle>
          <CardDescription className="flex items-center gap-3">
            <Badge variant="outline">ID: {record?.id}</Badge>
            <span>{record?.field_name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-medium">Campana</h4>
            <p className="text-sm text-muted-foreground">{record?.campaign_season || "-"}</p>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-medium">Responsable</h4>
              <p className="text-sm text-muted-foreground">{record?.assigned_to || "-"}</p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">Vencimiento</h4>
              <p className="text-sm text-muted-foreground">
                {record?.due_date
                  ? new Date(String(record.due_date)).toLocaleDateString("es-AR")
                  : "-"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-medium">Prioridad</h4>
              <Badge variant="secondary">{String(record?.priority ?? "-")}</Badge>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">Estado</h4>
              <Badge>{String(record?.status ?? "-")}</Badge>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1 text-sm font-medium">Notas</h4>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {String(record?.notes ?? "Sin observaciones")}
            </p>
          </div>
        </CardContent>
      </Card>
    </ShowView>
  );
}
