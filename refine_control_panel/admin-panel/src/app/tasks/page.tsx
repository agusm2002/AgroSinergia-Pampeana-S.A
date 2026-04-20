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

type Task = {
  id: number;
  title: string;
  field_name: string;
  campaign_season: string;
  assigned_to: string;
  due_date: string;
  priority: string;
  status: string;
};

export default function TaskList() {
  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Task>();

    return [
      columnHelper.accessor("id", {
        id: "id",
        header: "ID",
        enableSorting: false,
      }),
      columnHelper.accessor("title", {
        id: "title",
        header: "Tarea",
        enableSorting: true,
      }),
      columnHelper.accessor("field_name", {
        id: "field_name",
        header: "Lote",
        enableSorting: true,
      }),
      columnHelper.accessor("campaign_season", {
        id: "campaign_season",
        header: "Campana",
        enableSorting: true,
      }),
      columnHelper.accessor("assigned_to", {
        id: "assigned_to",
        header: "Responsable",
        enableSorting: true,
      }),
      columnHelper.accessor("due_date", {
        id: "due_date",
        header: "Vencimiento",
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue();
          return date ? new Date(date).toLocaleDateString("es-AR") : "-";
        },
      }),
      columnHelper.accessor("priority", {
        id: "priority",
        header: "Prioridad",
        enableSorting: true,
        cell: ({ getValue }) => {
          const value = getValue();
          const variant =
            value === "Alta"
              ? "destructive"
              : value === "Media"
                ? "default"
                : "secondary";
          return <Badge variant={variant}>{value}</Badge>;
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Estado",
        enableSorting: true,
        cell: ({ getValue }) => {
          const value = getValue();
          const variant = value === "Completada" ? "secondary" : "default";
          return <Badge variant={variant}>{value}</Badge>;
        },
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
