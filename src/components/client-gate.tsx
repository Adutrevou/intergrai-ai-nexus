import { type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * Wraps a client-area page.
 *
 * NOTE: Login is temporarily disabled. This gate currently lets every visitor
 * straight through to the AppShell. To re-enable auth later, restore the
 * useAuth() check + redirect to /client/login.
 */
export function ClientGate({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
