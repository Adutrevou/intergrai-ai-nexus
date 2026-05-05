import { createServerFn } from "@tanstack/react-start";
import type { DemoTenantJoinResult } from "@/lib/demo-tenant.types";

export const joinDemoWorkspace = createServerFn({ method: "POST" })
  .handler(async (): Promise<DemoTenantJoinResult> => {
    const { joinDemoWorkspaceForRequest } = await import("@/server/demo-tenant.server");
    return joinDemoWorkspaceForRequest();
  });
