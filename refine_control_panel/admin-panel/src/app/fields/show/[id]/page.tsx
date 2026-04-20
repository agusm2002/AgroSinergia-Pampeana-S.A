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

export default function FieldShow() {
  const { result: record } = useShow({});

  return (
    <ShowView>
      <Card>
        <CardHeader>
          <CardTitle>{record?.name}</CardTitle>
          <CardDescription className="flex items-center gap-3">
            <Badge variant="outline">ID: {record?.id}</Badge>
            <span>{record?.zone}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-medium">Cultivo</h4>
            <p className="text-sm text-muted-foreground">{record?.crop || "-"}</p>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1 text-sm font-medium">Hectareas</h4>
            <p className="text-sm text-muted-foreground">
              {Number(record?.hectares ?? 0).toLocaleString("es-AR", {
                maximumFractionDigits: 1,
              })}
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1 text-sm font-medium">Humedad de suelo</h4>
            <p className="text-sm text-muted-foreground">
              {Number(record?.soil_moisture ?? 0).toFixed(1)}%
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1 text-sm font-medium">Estado</h4>
            <Badge>{String(record?.status ?? "-")}</Badge>
          </div>
        </CardContent>
      </Card>
    </ShowView>
  );
}
