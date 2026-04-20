"use client";

import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import React from "react";
import { ClipboardList, Sprout, Tractor } from "lucide-react";

import routerProvider from "@refinedev/nextjs-router";

import "@/app/globals.css";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { dataProvider } from "@providers/data-provider";

type RefineContextProps = {
  children: React.ReactNode;
};

export const RefineContext = ({ children }: RefineContextProps) => {
  const notificationProvider = useNotificationProvider();

  return (
    <RefineKbarProvider>
      <ThemeProvider>
        <Refine
          dataProvider={dataProvider}
          notificationProvider={notificationProvider}
          routerProvider={routerProvider}
          resources={[
            {
              name: "fields",
              list: "/fields",
              create: "/fields/create",
              edit: "/fields/edit/:id",
              show: "/fields/show/:id",
              meta: {
                label: "Lotes",
                icon: <Sprout size={16} />,
                canDelete: true,
              },
            },
            {
              name: "campaigns",
              list: "/campaigns",
              create: "/campaigns/create",
              edit: "/campaigns/edit/:id",
              show: "/campaigns/show/:id",
              meta: {
                label: "Campanas",
                icon: <Tractor size={16} />,
                canDelete: true,
              },
            },
            {
              name: "tasks",
              list: "/tasks",
              create: "/tasks/create",
              edit: "/tasks/edit/:id",
              show: "/tasks/show/:id",
              meta: {
                label: "Tareas",
                icon: <ClipboardList size={16} />,
                canDelete: true,
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            title: {
              text: "AgroSinergia Control",
              icon: <Sprout size={18} />,
            },
          }}
        >
          {children}
          <Toaster />
          <RefineKbar />
        </Refine>
      </ThemeProvider>
    </RefineKbarProvider>
  );
};
