import { Layout as BaseLayout } from "@components/refine-ui/layout/layout";
import React from "react";

export default async function Layout({ children }: React.PropsWithChildren) {
  return <BaseLayout>{children}</BaseLayout>;
}
