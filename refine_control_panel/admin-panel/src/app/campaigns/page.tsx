"use client";

import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";

type Campaign = {
  id: number;
  field_name: string;
  field_id: number;
  season: string;
  budget_usd: number;
  expected_yield_tn: number;
  progress: number;
  status: string;
};

export default function CampaignList() {
  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Campaign>();

    return [
      columnHelper.accessor("id", {
        id: "id",
        header: "ID",
        enableSorting: false,
      }),
      columnHelper.accessor("field_name", {
        id: "field_name",
        header: "Lote",
        enableSorting: true,
      }),
      columnHelper.accessor("season", {
        id: "season",
        header: "Campana",
        enableSorting: true,
      }),
      columnHelper.accessor("progress", {
        id: "progress",
        header: "Avance",
        enableSorting: true,
        cell: ({ getValue }) => {
          const value = Number(getValue() ?? 0);
          return (
            <div className="flex min-w-32 items-center gap-2">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{value}%</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Estado",
        enableSorting: true,
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <Badge variant={status === "En Curso" ? "default" : "secondary"}>
              {status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("budget_usd", {
        id: "budget_usd",
        header: "Presupuesto",
        enableSorting: true,
        cell: ({ getValue }) =>
          Number(getValue() ?? 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }),
      }),
      columnHelper.accessor("expected_yield_tn", {
        id: "expected_yield_tn",
        header: "Rinde est.",
        enableSorting: true,
        cell: ({ getValue }) => `${Number(getValue() ?? 0).toFixed(1)} tn`,
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditButton recordItemId={row.original.id} size="sm" />
            <ShowButton recordItemId={row.original.id} size="sm" />
            <DeleteButton recordItemId={row.original.id} size="sm" />
          </div>
        ),
        enableSorting: false,
        size: 280,
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    refineCoreProps: {
      syncWithLocation: true,
    },
  });

  return (
    <ListView>
      <DataTable table={table} />
    </ListView>
  );
}
