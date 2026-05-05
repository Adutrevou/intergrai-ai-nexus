import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Sparkles } from "lucide-react";

/** Wraps a client-area page: redirects to /client/login if not authenticated. */
export function ClientGate({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/client/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse" /> Loading workspace…
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
