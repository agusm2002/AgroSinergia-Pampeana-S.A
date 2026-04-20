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

type Field = {
  id: number;
  name: string;
  zone: string;
  hectares: number;
  crop: string;
  status: string;
  soil_moisture: number;
};

export default function FieldList() {
  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Field>();

    return [
      columnHelper.accessor("id", {
        id: "id",
        header: "ID",
        enableSorting: false,
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: "Lote",
        enableSorting: true,
      }),
      columnHelper.accessor("zone", {
        id: "zone",
        header: "Zona",
        enableSorting: true,
      }),
      columnHelper.accessor("crop", {
        id: "crop",
        header: "Cultivo",
        enableSorting: true,
      }),
      columnHelper.accessor("hectares", {
        id: "hectares",
        header: "Hectareas",
        enableSorting: true,
        cell: ({ getValue }) =>
          Number(getValue() ?? 0).toLocaleString("es-AR", {
            maximumFractionDigits: 1,
          }),
      }),
      columnHelper.accessor("soil_moisture", {
        id: "soil_moisture",
        header: "Humedad",
        enableSorting: true,
        cell: ({ getValue }) => `${Number(getValue() ?? 0).toFixed(1)}%`,
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Estado",
        enableSorting: true,
        cell: ({ getValue }) => {
          const status = getValue();
          const variant =
            status === "En Seguimiento"
              ? "default"
              : status === "Cosechado"
                ? "secondary"
                : "outline";

          return <Badge variant={variant}>{status}</Badge>;
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
