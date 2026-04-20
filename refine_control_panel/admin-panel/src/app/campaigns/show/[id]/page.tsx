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

export default function CampaignShow() {
  const { result: record } = useShow({});

  return (
    <ShowView>
      <Card>
        <CardHeader>
          <CardTitle>
            {record?.field_name} · {record?.season}
          </CardTitle>
          <CardDescription className="flex items-center gap-3">
            <Badge variant="outline">ID: {record?.id}</Badge>
            <span>Campo #{record?.field_id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-medium">Estado</h4>
            <Badge>{String(record?.status ?? "-")}</Badge>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1 text-sm font-medium">Avance</h4>
            <p className="text-sm text-muted-foreground">{record?.progress ?? 0}%</p>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-medium">Presupuesto</h4>
              <p className="text-sm text-muted-foreground">
                {Number(record?.budget_usd ?? 0).toLocaleString("es-AR", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">Rinde estimado</h4>
              <p className="text-sm text-muted-foreground">
                {Number(record?.expected_yield_tn ?? 0).toFixed(1)} tn
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-medium">Inicio</h4>
              <p className="text-sm text-muted-foreground">
                {record?.start_date
                  ? new Date(String(record.start_date)).toLocaleDateString("es-AR")
                  : "-"}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">Cierre</h4>
              <p className="text-sm text-muted-foreground">
                {record?.end_date
                  ? new Date(String(record.end_date)).toLocaleDateString("es-AR")
                  : "-"}
               </p>
             </div>
           </div>
         </CardContent>
       </Card>
     </ShowView>
   );
 }
